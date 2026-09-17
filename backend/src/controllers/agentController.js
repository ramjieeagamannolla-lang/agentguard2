import { Agent } from '../models/Agent.js';
import { Audit } from '../models/Audit.js';
import { ToolCallLog } from '../models/ToolCallLog.js';
import { TOOL_REGISTRY, permissionsForTools, ALL_TOOLS } from '../permissions/registry.js';
import { runTargetAgent } from '../agents/targetAgent.js';
import { executeTool, PermissionDeniedError } from '../tools/enforcement.js';

export async function listTools(_req, res) {
  res.json({ tools: ALL_TOOLS });
}

export async function createAgent(req, res, next) {
  try {
    const { name, task, description = '', tools = [] } = req.body;

    if (!name?.trim() || !task?.trim()) {
      return res.status(400).json({ error: 'name and task are required.' });
    }
    const invalid = tools.filter((t) => !TOOL_REGISTRY[t]);
    if (invalid.length) {
      return res.status(400).json({ error: `Unknown tools: ${invalid.join(', ')}` });
    }

    const permissions = permissionsForTools(tools);

    const agent = await Agent.create({
      name: name.trim(),
      task: task.trim(),
      description,
      tools,
      grantedPermissions: permissions,
      originalPermissions: permissions,
      status: 'UNAUDITED',
      riskLevel: 'UNKNOWN',
    });

    res.status(201).json({ agent: decorate(agent.toObject()) });
  } catch (e) { next(e); }
}

export async function listAgents(_req, res, next) {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 }).lean();
    res.json({ agents: agents.map(decorate) });
  } catch (e) { next(e); }
}

export async function getAgent(req, res, next) {
  try {
    const agent = await Agent.findById(req.params.id).lean();
    if (!agent) return res.status(404).json({ error: 'Agent not found.' });
    const audits = await Audit.find({ agentId: agent._id }).sort({ createdAt: -1 }).lean();
    res.json({ agent: decorate(agent), audits });
  } catch (e) { next(e); }
}

export async function deleteAgent(req, res, next) {
  try {
    await Agent.findByIdAndDelete(req.params.id);
    await Audit.deleteMany({ agentId: req.params.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function chatWithAgent(req, res, next) {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message is required.' });

    const agent = await Agent.findById(req.params.id).lean();
    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    const out = await runTargetAgent({ agent, message, history });
    res.json(out);
  } catch (e) { next(e); }
}

/**
 * Direct tool invocation, bypassing the LLM entirely.
 * This exists for the demo's final proof step: you can try to call
 * deleteOrder() after revocation and watch the backend refuse.
 */
export async function probeTool(req, res, next) {
  try {
    const { toolName, args = {} } = req.body;
    const result = await executeTool({ agentId: req.params.id, toolName, args });
    res.json({ allowed: true, toolName, result });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return res.status(403).json({
        allowed: false,
        code: 'PERMISSION_DENIED',
        toolName: err.toolName,
        permission: err.permission,
        message: err.message,
      });
    }
    next(err);
  }
}

export async function toolLogs(req, res, next) {
  try {
    const logs = await ToolCallLog.find({ agentId: req.params.id })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json({ logs });
  } catch (e) { next(e); }
}

function decorate(agent) {
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
