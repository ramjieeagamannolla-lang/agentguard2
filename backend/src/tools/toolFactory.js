import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { TOOL_REGISTRY } from '../permissions/registry.js';
import { executeTool, PermissionDeniedError } from './enforcement.js';

const schemas = {
  getOrder: z.object({ orderId: z.string().describe('The order number, e.g. "1024"') }),
  getCustomer: z.object({ customerId: z.string().describe('The customer ID, e.g. "C-100"') }),
  getInventory: z.object({ sku: z.string().describe('The product SKU, e.g. "SKU-77"') }),
  updateOrder: z.object({
    orderId: z.string(),
    status: z.string().optional(),
    shippingAddress: z.string().optional(),
    notes: z.string().optional(),
  }),
  deleteOrder: z.object({ orderId: z.string() }),
  issueRefund: z.object({ orderId: z.string(), amount: z.number() }),
  getPayroll: z.object({ employeeId: z.string().describe('Employee ID, e.g. "E-01"') }),
};

/**
 * Build the LangChain tool objects bound to a specific agent.
 *
 * Two layers of defence, deliberately:
 *   1. We only BIND tools whose permission is currently granted, so a
 *      revoked tool isn't even in the model's schema.
 *   2. Each bound tool still routes through executeTool(), which re-checks
 *      the grant in the database. So even a stale binding fails closed.
 */
export function buildToolsForAgent(agent) {
  const granted = new Set(agent.grantedPermissions || []);

  return Object.values(TOOL_REGISTRY)
    .filter((spec) => granted.has(spec.permission))
    .map((spec) =>
      tool(
        async (args) => {
          try {
            const result = await executeTool({
              agentId: agent._id,
              toolName: spec.toolName,
              args,
            });
            return JSON.stringify(result);
          } catch (err) {
            if (err instanceof PermissionDeniedError) {
              // Returned to the model as a tool result rather than thrown,
              // so the agent can explain the refusal to the user instead of
              // the whole turn blowing up.
              return JSON.stringify({ error: 'PERMISSION_DENIED', message: err.message });
            }
            return JSON.stringify({ error: 'TOOL_ERROR', message: err.message });
          }
        },
        {
          name: spec.toolName,
          description: `${spec.description} (requires ${spec.permission})`,
          schema: schemas[spec.toolName],
        }
      )
    );
}
