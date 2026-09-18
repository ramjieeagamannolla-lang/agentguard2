import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { z } from 'zod';
import { getLLM } from './llm.js';
import { PERMISSIONS, permissionMeta } from '../permissions/registry.js';
import {
  TASK_ANALYZER_PROMPT,
  PERMISSION_AUDITOR_PROMPT,
  RISK_ANALYZER_PROMPT,
  RECOMMENDATION_PROMPT,
} from '../prompts/auditPrompts.js';

/* ---------------------------------------------------------------- *
 * Structured output schemas — each node returns typed JSON, not prose
 * ---------------------------------------------------------------- */

const permissionKeys = Object.keys(PERMISSIONS);
const PermEnum = z.enum(permissionKeys);

const TaskAnalysisSchema = z.object({
  requiredPermissions: z.array(PermEnum).describe('Minimum permissions the task needs'),
  reasoning: z.string().describe('Why exactly these permissions and no more'),
});

const PermissionAuditSchema = z.object({
  excessivePermissions: z.array(z.string()),
  missingPermissions: z.array(z.string()),
  summary: z.string(),
});

const RiskAnalysisSchema = z.object({
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  risks: z.array(
    z.object({
      permission: z.string(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      reason: z.string(),
    })
  ),
});

const RecommendationSchema = z.object({
  keep: z.array(z.string()),
  remove: z.array(z.string()),
  add: z.array(z.string()),
  rationale: z.string(),
});

/* ---------------------------------------------------------------- *
 * Graph state
 * ---------------------------------------------------------------- */

const AuditState = Annotation.Root({
  agentName: Annotation(),
  task: Annotation(),
  description: Annotation(),
  actualTools: Annotation(),
  actualPermissions: Annotation(),

  requiredPermissions: Annotation(),
  taskAnalysis: Annotation(),

  excessivePermissions: Annotation(),
  missingPermissions: Annotation(),
  auditSummary: Annotation(),

  riskLevel: Annotation(),
  riskReasons: Annotation(),

  recommendations: Annotation(),

  nodeTrace: Annotation({
    reducer: (a = [], b = []) => [...a, ...b],
    default: () => [],
  }),
});

function catalogue() {
  return Object.values(PERMISSIONS)
    .map(
      (p) =>
        `- ${p.key} | type=${p.type} | sensitivity=${p.sensitivity} | baseRisk=${p.risk} | ${p.description}`
    )
    .join('\n');
}

/** Wraps a node so timing + status land in the trace the UI animates. */
function traced(name, fn) {
  return async (state) => {
    const startedAt = new Date();
    try {
      const patch = await fn(state);
      const finishedAt = new Date();
      return {
        ...patch,
        nodeTrace: [
          { node: name, status: 'COMPLETED', startedAt, finishedAt, ms: finishedAt - startedAt },
        ],
      };
    } catch (err) {
      const finishedAt = new Date();
      err.nodeTrace = [
        { node: name, status: 'FAILED', startedAt, finishedAt, ms: finishedAt - startedAt },
      ];
      throw err;
    }
  };
}

/* ---------------------------------------------------------------- *
 * Nodes
 * ---------------------------------------------------------------- */

const taskAnalyzer = traced('taskAnalyzer', async (state) => {
  const llm = getLLM().withStructuredOutput(TaskAnalysisSchema, { name: 'task_analysis' });

  try {
    const res = await llm.invoke([
      { role: 'system', content: TASK_ANALYZER_PROMPT },
      {
        role: 'user',
        content: `AGENT NAME: ${state.agentName}
STATED TASK: ${state.task}
DESCRIPTION: ${state.description || '(none)'}

ACTUAL TOOLS WIRED TO THIS AGENT:
${(state.actualTools || []).map((t) => `- ${t.toolName} (${t.permission}): ${t.description}`).join('\n') || '(none)'}

PERMISSION CATALOGUE:
${catalogue()}

Determine the minimum required permissions for this task.`,
      },
    ]);

    return {
      requiredPermissions: res.requiredPermissions,
      taskAnalysis: res.reasoning,
    };
  } catch (err) {
    console.warn('[auditGraph] task analyzer structured output failed; using deterministic fallback:', err.message);
    return deterministicTaskAnalysis(state);
  }
});

const permissionAuditor = traced('permissionAuditor', async (state) => {
  const llm = getLLM().withStructuredOutput(PermissionAuditSchema, { name: 'permission_audit' });

  let summary;
  try {
    const res = await llm.invoke([
      { role: 'system', content: PERMISSION_AUDITOR_PROMPT },
      {
        role: 'user',
        content: `TASK: ${state.task}

ACTUAL TOOLS:
${(state.actualTools || []).map((t) => `- ${t.toolName} -> ${t.permission}`).join('\n') || '(none)'}

REQUIRED PERMISSIONS (from Task Analyzer):
${state.requiredPermissions.join(', ') || '(none)'}

ACTUALLY GRANTED PERMISSIONS:
${state.actualPermissions.join(', ') || '(none)'}

Compute excessive and missing sets, then summarize the gap.`,
      },
    ]);
    summary = res.summary;
  } catch (err) {
    console.warn('[auditGraph] permission auditor structured output failed; using deterministic fallback:', err.message);
    summary = deterministicAuditSummary(state);
  }

  // Deterministic set arithmetic is authoritative here. The LLM's summary is
  // valuable prose, but we never let a model's arithmetic decide what gets
  // revoked — that has to be exact.
  const required = new Set(state.requiredPermissions);
  const actual = new Set(state.actualPermissions);

  return {
    excessivePermissions: [...actual].filter((p) => !required.has(p)),
    missingPermissions: [...required].filter((p) => !actual.has(p)),
    auditSummary: summary,
  };
});

const riskAnalyzer = traced('riskAnalyzer', async (state) => {
  if (!state.excessivePermissions.length) {
    return {
      riskLevel: 'LOW',
      riskReasons: [],
    };
  }

  const llm = getLLM().withStructuredOutput(RiskAnalysisSchema, { name: 'risk_analysis' });

  const meta = state.excessivePermissions
    .map((p) => {
      const m = permissionMeta(p);
      return `- ${m.key} | type=${m.type} | sensitivity=${m.sensitivity} | baseRisk=${m.risk} | ${m.description}`;
    })
    .join('\n');

  try {
    const res = await llm.invoke([
      { role: 'system', content: RISK_ANALYZER_PROMPT },
      {
        role: 'user',
        content: `AGENT: ${state.agentName}
TASK: ${state.task}

EXCESSIVE PERMISSIONS AND THEIR METADATA:
${meta}

Assess the concrete risk of each, then assign an overall risk level.`,
      },
    ]);

    return { riskLevel: res.riskLevel, riskReasons: res.risks };
  } catch (err) {
    console.warn('[auditGraph] risk analyzer structured output failed; using deterministic fallback:', err.message);
    return deterministicRisk(state);
  }
});

const recommendationAgent = traced('recommendationAgent', async (state) => {
  const llm = getLLM().withStructuredOutput(RecommendationSchema, { name: 'recommendation' });

  let rationale;
  try {
    const res = await llm.invoke([
      { role: 'system', content: RECOMMENDATION_PROMPT },
      {
        role: 'user',
        content: `AGENT: ${state.agentName}
TASK: ${state.task}
GRANTED: ${state.actualPermissions.join(', ') || '(none)'}
REQUIRED: ${state.requiredPermissions.join(', ') || '(none)'}
EXCESSIVE: ${state.excessivePermissions.join(', ') || '(none)'}
MISSING: ${state.missingPermissions.join(', ') || '(none)'}
RISK LEVEL: ${state.riskLevel}

Produce the least-privilege recommendation and a rationale for a human approver.`,
      },
    ]);
    rationale = res.rationale;
  } catch (err) {
    console.warn('[auditGraph] recommendation structured output failed; using deterministic fallback:', err.message);
    rationale = deterministicRationale(state);
  }

  // Again: the sets we will actually act on are computed, not generated.
  const required = new Set(state.requiredPermissions);
  return {
    recommendations: {
      keep: state.actualPermissions.filter((p) => required.has(p)),
      remove: state.excessivePermissions,
      add: state.missingPermissions,
      rationale,
    },
  };
});

function deterministicTaskAnalysis(state) {
  const text = `${state.agentName || ''} ${state.task || ''} ${state.description || ''}`.toLowerCase();
  const required = [];

  addIf(text, required, ['order', 'customer', 'shipping', 'delivery'], ['READ_ORDERS', 'READ_CUSTOMER']);
  addIf(text, required, ['employee', 'leave', 'payroll', 'hr'], ['READ_EMPLOYEE', 'READ_LEAVE', 'READ_PAYROLL']);
  addIf(text, required, ['invoice', 'payment', 'finance'], ['READ_INVOICES', 'READ_PAYMENTS']);
  addIf(text, required, ['product', 'stock', 'inventory'], ['READ_PRODUCTS', 'READ_STOCK']);
  addIf(text, required, ['campaign', 'marketing'], ['READ_CAMPAIGNS', 'READ_CAMPAIGN_METRICS']);
  addIf(text, required, ['appointment', 'schedule', 'slot'], ['READ_APPOINTMENTS', 'READ_SLOTS']);

  const actual = new Set(state.actualPermissions || []);
  const available = new Set(Object.keys(PERMISSIONS));
  const requiredPermissions = [...new Set(required)].filter((p) => available.has(p) && (actual.has(p) || p.startsWith('READ_')));

  return {
    requiredPermissions,
    taskAnalysis: `Deterministic fallback inferred the minimum read-only scope from the stated task: ${requiredPermissions.join(', ') || 'none'}.`,
  };
}

function deterministicAuditSummary(state) {
  return `Deterministic fallback compared required permissions with the agent's granted permissions for "${state.task}".`;
}

function deterministicRisk(state) {
  const riskReasons = (state.excessivePermissions || []).map((permission) => {
    const meta = permissionMeta(permission);
    return {
      permission,
      severity: meta.risk === 'HIGH' ? 'HIGH' : meta.risk === 'MEDIUM' ? 'MEDIUM' : 'LOW',
      reason: `${permission} is not required for "${state.task}" but would allow ${meta.description.toLowerCase()}`,
    };
  });

  const riskLevel = riskReasons.some((r) => r.severity === 'HIGH')
    ? 'HIGH'
    : riskReasons.some((r) => r.severity === 'MEDIUM')
      ? 'MEDIUM'
      : 'LOW';

  return { riskLevel, riskReasons };
}

function addIf(text, target, keywords, permissions) {
  if (keywords.some((word) => text.includes(word))) target.push(...permissions);
}

function deterministicRationale(state) {
  const removed = state.excessivePermissions?.length
    ? `Remove ${state.excessivePermissions.join(', ')} because the stated task does not require them.`
    : 'No permissions need to be removed.';
  const added = state.missingPermissions?.length
    ? ` Add ${state.missingPermissions.join(', ')} because they are required for the stated task.`
    : '';
  const kept = state.requiredPermissions?.length
    ? ` Keep ${state.requiredPermissions.join(', ')} as the least-privilege operating scope.`
    : ' Keep no permissions unless the task is expanded.';
  return `${removed}${added}${kept}`;
}

/* ---------------------------------------------------------------- *
 * Graph assembly
 *
 * taskAnalyzer → permissionAuditor → riskAnalyzer → recommendationAgent → END
 *
 * The graph deliberately ENDS before applying anything. Human approval is a
 * separate, explicit API call. AgentGuard never mutates permissions on its own.
 * ---------------------------------------------------------------- */

export const AUDIT_NODES = [
  { id: 'taskAnalyzer', label: 'Task Analyzer', description: "Understands what the agent is for" },
  { id: 'permissionAuditor', label: 'Permission Auditor', description: 'Compares required vs granted' },
  { id: 'riskAnalyzer', label: 'Risk Analyzer', description: 'Assesses blast radius of excess' },
  { id: 'recommendationAgent', label: 'Recommendation Agent', description: 'Proposes least privilege' },
  { id: 'humanApproval', label: 'Human Approval', description: 'Required before any change' },
];

const workflow = new StateGraph(AuditState)
  .addNode('taskAnalyzer', taskAnalyzer)
  .addNode('permissionAuditor', permissionAuditor)
  .addNode('riskAnalyzer', riskAnalyzer)
  .addNode('recommendationAgent', recommendationAgent)
  .addEdge(START, 'taskAnalyzer')
  .addEdge('taskAnalyzer', 'permissionAuditor')
  .addEdge('permissionAuditor', 'riskAnalyzer')
  .addEdge('riskAnalyzer', 'recommendationAgent')
  .addEdge('recommendationAgent', END);

export const auditGraph = workflow.compile();

export async function runAudit({ agentName, task, description, actualTools, actualPermissions }) {
  return auditGraph.invoke({
    agentName,
    task,
    description,
    actualTools,
    actualPermissions,
  });
}
