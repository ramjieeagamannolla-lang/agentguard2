import { Agent } from '../models/Agent.js';
import { ToolCallLog } from '../models/ToolCallLog.js';
import { TOOL_REGISTRY } from '../permissions/registry.js';
import { implementations } from './sandboxTools.js';

export class PermissionDeniedError extends Error {
  constructor(toolName, permission) {
    super(
      `PERMISSION_DENIED: tool "${toolName}" requires permission "${permission}", ` +
        `which is not granted to this agent. The call was blocked by AgentGuard ` +
        `and no data was read or modified.`
    );
    this.name = 'PermissionDeniedError';
    this.toolName = toolName;
    this.permission = permission;
    this.code = 'PERMISSION_DENIED';
  }
}

/**
 * THE ONLY sanctioned way to execute a sandbox tool.
 *
 * Why it re-reads the Agent from Mongo on every single call instead of
 * trusting a permission list passed down from the caller: the LLM is
 * untrusted input, and so is anything derived from a request. If an
 * approval revokes DELETE_ORDERS mid-session, or the model hallucinates
 * a tool that was never bound to it, this check still fails closed.
 * The UI hiding a button is cosmetic; this is the actual control.
 */
export async function executeTool({ agentId, toolName, args = {} }) {
  const spec = TOOL_REGISTRY[toolName];

  if (!spec) {
    await log({ agentId, toolName, permission: null, args, outcome: 'DENIED', denyReason: 'UNKNOWN_TOOL' });
    throw new PermissionDeniedError(toolName, 'UNKNOWN');
  }

  // Authoritative, freshly-read grant list.
  const agent = await Agent.findById(agentId).select('grantedPermissions name').lean();
  if (!agent) throw new Error(`Agent ${agentId} not found.`);

  const granted = new Set(agent.grantedPermissions || []);
  if (!granted.has(spec.permission)) {
    await log({
      agentId,
      toolName,
      permission: spec.permission,
      args,
      outcome: 'DENIED',
      denyReason: `Permission ${spec.permission} not granted`,
    });
    throw new PermissionDeniedError(toolName, spec.permission);
  }

  try {
    const result = await implementations[toolName](args);
    await log({ agentId, toolName, permission: spec.permission, args, outcome: 'ALLOWED', result });
    return result;
  } catch (err) {
    await log({
      agentId,
      toolName,
      permission: spec.permission,
      args,
      outcome: 'ERROR',
      denyReason: err.message,
    });
    throw err;
  }
}

async function log(entry) {
  try {
    await ToolCallLog.create(entry);
  } catch (e) {
    console.error('[enforcement] failed to write tool call log:', e.message);
  }
}
