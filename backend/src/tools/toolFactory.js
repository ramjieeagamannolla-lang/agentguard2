import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { TOOL_REGISTRY } from '../permissions/registry.js';
import { executeTool, PermissionDeniedError } from './enforcement.js';

const schemas = {
  getOrder: z.object({ orderId: z.string().describe('The order number, e.g. "1024"') }),
  getCustomer: z.object({ customerId: z.string().describe('The customer ID, e.g. "C-100"') }),
  updateOrder: z.object({
    orderId: z.string(),
    status: z.string().optional(),
    shippingAddress: z.string().optional(),
    notes: z.string().optional(),
  }),
  deleteOrder: z.object({ orderId: z.string() }),
  getPayroll: z.object({ employeeId: z.string().describe('Employee ID, e.g. "E-01"') }),
  getEmployee: z.object({ employeeId: z.string().optional().describe('Employee ID; use "E-01" when the user says my/me without an ID') }),
  getLeaveBalance: z.object({ employeeId: z.string().optional().describe('Employee ID; use "E-01" when the user says my/me without an ID') }),
  updateEmployee: z.object({
    employeeId: z.string(),
    role: z.string().optional(),
    department: z.string().optional(),
    manager: z.string().optional(),
  }),
  deleteEmployee: z.object({ employeeId: z.string() }),
  getInvoice: z.object({ invoiceId: z.string().describe('Invoice ID, e.g. "INV-1001"') }),
  getPayment: z.object({ paymentId: z.string().optional(), invoiceId: z.string().optional() }),
  updateInvoice: z.object({
    invoiceId: z.string(),
    status: z.string().optional(),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
  }),
  deleteInvoice: z.object({ invoiceId: z.string() }),
  getEmployeeSalary: z.object({ employeeId: z.string().describe('Employee ID, e.g. "E-03"') }),
  getProduct: z.object({ productId: z.string().describe('Product ID, e.g. "P100"') }),
  getStock: z.object({ productId: z.string().describe('Product ID, e.g. "P100"') }),
  updateStock: z.object({ productId: z.string(), stock: z.coerce.number() }),
  deleteProduct: z.object({ productId: z.string() }),
  updateProductPrice: z.object({ productId: z.string(), price: z.coerce.number() }),
  getCampaign: z.object({ campaignId: z.string().optional(), name: z.string().optional() }),
  getCampaignMetrics: z.object({ campaignId: z.string().optional(), name: z.string().optional() }),
  updateCampaign: z.object({
    campaignId: z.string(),
    status: z.string().optional(),
    budget: z.coerce.number().optional(),
    notes: z.string().optional(),
  }),
  deleteCampaign: z.object({ campaignId: z.string() }),
  getEmployeeData: z.object({ employeeId: z.string().describe('Employee ID, e.g. "E-02"') }),
  getAppointment: z.object({
    appointmentId: z.string().optional(),
    attendee: z.string().optional(),
    date: z.string().optional().describe('Date as YYYY-MM-DD, today or tomorrow'),
  }),
  getAvailableSlots: z.object({ date: z.string().optional().describe('Date as YYYY-MM-DD, today or tomorrow') }),
  createAppointment: z.object({
    attendee: z.string(),
    date: z.string(),
    time: z.string(),
    topic: z.string(),
  }),
  updateAppointment: z.object({
    appointmentId: z.string(),
    date: z.string().optional(),
    time: z.string().optional(),
    status: z.string().optional(),
    topic: z.string().optional(),
  }),
  deleteAppointment: z.object({ appointmentId: z.string() }),

  // Compatibility tools from the earlier demo.
  getInventory: z.object({ sku: z.string().describe('The product SKU, e.g. "SKU-77"') }),
  issueRefund: z.object({ orderId: z.string(), amount: z.coerce.number() }),
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
          schema: schemas[spec.toolName] ?? z.object({}),
        }
      )
    );
}
