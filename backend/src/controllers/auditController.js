import { Agent } from '../models/Agent.js';
import { Audit } from '../models/Audit.js';
import { runAudit, AUDIT_NODES } from '../ai/auditGraph.js';
import { permissionMeta, TOOL_REGISTRY, toolsForPermissions } from '../permissions/registry.js';

export function graphShape(_req, res) {
  res.json({ nodes: AUDIT_NODES });
}

/** POST /api/audits — runs the full LangGraph workflow. */
export async function createAudit(req, res, next) {
  try {
    const { agentId } = req.body;
    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    const result = await runAudit({
      agentName: agent.name,
      task: agent.task,
      description: agent.description,
      actualTools: (agent.tools || []).map((toolName) => TOOL_REGISTRY[toolName]).filter(Boolean),
      actualPermissions: agent.grantedPermissions,
    });

    const audit = await Audit.create({
      agentId: agent._id,
      agentName: agent.name,
      task: agent.task,
      originalPermissions: agent.grantedPermissions,
      requiredPermissions: result.requiredPermissions,
      excessivePermissions: result.excessivePermissions,
      missingPermissions: result.missingPermissions,
      taskAnalysis: result.taskAnalysis,
      auditSummary: result.auditSummary,
      riskLevel: result.riskLevel,
      riskReasons: result.riskReasons,
      recommendations: result.recommendations,
      approvalStatus: 'PENDING',
      nodeTrace: result.nodeTrace,
    });

    // The audit updates the agent's risk rating, but NOT its permissions.
    // Permissions only change on explicit human approval.
    agent.riskLevel = result.riskLevel;
    agent.lastAuditId = audit._id;
    await agent.save();

    res.status(201).json({ audit: decorateAudit(audit.toObject()) });
  } catch (e) { next(e); }
}

export async function listAudits(_req, res, next) {
  try {
    const audits = await Audit.find().sort({ createdAt: -1 }).lean();
    res.json({ audits: audits.map(decorateAudit) });
  } catch (e) { next(e); }
}

export async function getAudit(req, res, next) {
  try {
    const audit = await Audit.findById(req.params.id).lean();
    if (!audit) return res.status(404).json({ error: 'Audit not found.' });
    const agent = await Agent.findById(audit.agentId).lean();
    res.json({ audit: decorateAudit(audit), agent });
  } catch (e) { next(e); }
}

/**
 * POST /api/audits/:id/approve
 * THE ONLY code path in AgentGuard that mutates an agent's permissions.
 */
export async function approveAudit(req, res, next) {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found.' });
    if (audit.approvalStatus !== 'PENDING') {
      return res.status(409).json({ error: `Audit already ${audit.approvalStatus.toLowerCase()}.` });
    }

    const agent = await Agent.findById(audit.agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    const before = [...agent.grantedPermissions];

    const finalPermissions = [
      ...new Set([...audit.recommendations.keep, ...audit.recommendations.add]),
    ];

    agent.grantedPermissions = finalPermissions;
    agent.tools = toolsForPermissions(finalPermissions).map((t) => t.toolName);
    agent.status = 'SECURED';
    agent.riskLevel = audit.recommendations.remove.length ? 'LOW' : agent.riskLevel;
    await agent.save();

    audit.approvalStatus = 'APPROVED';
    audit.decidedBy = req.body?.decidedBy || 'Security Admin';
    audit.decidedAt = new Date();
    audit.finalPermissions = finalPermissions;
    await audit.save();

    res.json({
      audit: decorateAudit(audit.toObject()),
      agent: decorateAgent(agent.toObject()),
      change: {
        before,
        after: finalPermissions,
        removed: before.filter((p) => !finalPermissions.includes(p)),
        added: finalPermissions.filter((p) => !before.includes(p)),
      },
    });
  } catch (e) { next(e); }
}

export async function rejectAudit(req, res, next) {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found.' });
    if (audit.approvalStatus !== 'PENDING') {
      return res.status(409).json({ error: `Audit already ${audit.approvalStatus.toLowerCase()}.` });
    }

    // Explicitly leaves the agent untouched.
    audit.approvalStatus = 'REJECTED';
    audit.decidedBy = req.body?.decidedBy || 'Security Admin';
    audit.decidedAt = new Date();
    audit.finalPermissions = audit.originalPermissions;
    await audit.save();

    res.json({ audit: decorateAudit(audit.toObject()), agentModified: false });
  } catch (e) { next(e); }
}

export async function dashboardStats(_req, res, next) {
  try {
    const [agents, audits] = await Promise.all([
      Agent.find().lean(),
      Audit.find().lean(),
    ]);
    res.json({
      totalAgents: agents.length,
      highRisk: agents.filter((a) => a.riskLevel === 'HIGH').length,
      mediumRisk: agents.filter((a) => a.riskLevel === 'MEDIUM').length,
      lowRisk: agents.filter((a) => a.riskLevel === 'LOW').length,
      totalAudits: audits.length,
      pendingApprovals: audits.filter((a) => a.approvalStatus === 'PENDING').length,
      securedAgents: agents.filter((a) => a.status === 'SECURED').length,
    });
  } catch (e) { next(e); }
}

function decorateAudit(audit) {
  const meta = (keys = []) => keys.map((k) => permissionMeta(k));
  return {
    ...audit,
    requiredMeta: meta(audit.requiredPermissions),
    excessiveMeta: meta(audit.excessivePermissions),
    originalMeta: meta(audit.originalPermissions),
  };
}

function decorateAgent(agent) {
  return {
    ...agent,
    toolDetails: (agent.tools || []).map((t) => TOOL_REGISTRY[t]).filter(Boolean),
    activeTools: (agent.tools || []).filter(
      (t) => TOOL_REGISTRY[t] && (agent.grantedPermissions || []).includes(TOOL_REGISTRY[t].permission)
    ),
    revokedTools: (agent.tools || []).filter(
      (t) => TOOL_REGISTRY[t] && !(agent.grantedPermissions || []).includes(TOOL_REGISTRY[t].permission)
    ),
  };
}
