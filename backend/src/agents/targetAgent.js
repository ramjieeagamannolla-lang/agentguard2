import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { getLLM } from '../ai/llm.js';
import { buildToolsForAgent } from '../tools/toolFactory.js';
import { TOOL_REGISTRY } from '../permissions/registry.js';

const MAX_TOOL_ROUNDS = 5;

function systemPrompt(agent, tools) {
  const toolLines = tools.length
    ? tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')
    : '(you currently have no tools)';

  return `You are "${agent.name}", an AI agent deployed inside a company.

YOUR TASK:
${agent.task}

${agent.description ? `ADDITIONAL CONTEXT:\n${agent.description}\n` : ''}
TOOLS AVAILABLE TO YOU RIGHT NOW:
${toolLines}

RULES:
- Use a tool whenever the user asks for specific record data. Do not invent order
  statuses, customer details, stock levels or payroll figures.
- If you do not have a tool for what the user asked, say so plainly and explain
  that you lack the permission for it. Never pretend to have performed the action.
- If a tool returns a PERMISSION_DENIED error, tell the user the action was blocked
  because that permission is not granted to you. Do not attempt a workaround.
- Answer in a clear, concise, professional tone.`;
}

/**
 * Runs one chat turn against a real LLM with real tool execution.
 *
 * Returns the assistant text plus a trace of every tool invocation, which the
 * UI surfaces as "Tool Used: getOrder() — Permission: READ_ORDERS".
 */
export async function runTargetAgent({ agent, message, history = [] }) {
  const tools = buildToolsForAgent(agent);
  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));

  const llm = getLLM({ temperature: 0 });
  const bound = tools.length ? llm.bindTools(tools) : llm;

  const messages = [new SystemMessage(systemPrompt(agent, tools))];

  for (const h of history.slice(-10)) {
    messages.push(h.role === 'user' ? new HumanMessage(h.content) : new AIMessage(h.content));
  }
  messages.push(new HumanMessage(message));

  const toolTrace = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await bound.invoke(messages);
    messages.push(res);

    const calls = res.tool_calls || [];
    if (!calls.length) {
      return {
        reply: textOf(res),
        toolTrace,
        toolsAvailable: tools.map((t) => t.name),
      };
    }

    for (const call of calls) {
      const spec = TOOL_REGISTRY[call.name];
      const impl = toolMap[call.name];

      let output;
      if (!impl) {
        // The model asked for a tool it was never bound to (hallucination, or
        // a revoked tool it remembers from earlier in the conversation).
        // Fail closed and tell it why.
        output = JSON.stringify({
          error: 'PERMISSION_DENIED',
          message: `Tool "${call.name}" is not available to this agent. The required permission is not granted.`,
        });
      } else {
        output = await impl.invoke(call.args);
      }

      let parsed;
      try {
        parsed = JSON.parse(output);
      } catch {
        parsed = { raw: output };
      }

      toolTrace.push({
        tool: call.name,
        permission: spec?.permission ?? 'UNKNOWN',
        args: call.args,
        denied: parsed?.error === 'PERMISSION_DENIED',
        result: parsed,
      });

      messages.push(new ToolMessage({ content: output, tool_call_id: call.id }));
    }
  }

  return {
    reply:
      'I reached the maximum number of tool steps for this request. Could you narrow it down?',
    toolTrace,
    toolsAvailable: tools.map((t) => t.name),
  };
}

function textOf(res) {
  if (typeof res.content === 'string') return res.content;
  if (Array.isArray(res.content)) {
    return res.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
  }
  return String(res.content ?? '');
}
