/**
 * Centralized permission + tool registry.
 *
 * This is the single source of truth for "what tools exist, what permission
 * each one demands, and how dangerous it is". Both the target agent runtime
 * and the AgentGuard audit graph read from here, so the auditor is always
 * reasoning about the same metadata the runtime enforces.
 */

export const PERMISSIONS = {
  READ_ORDERS: {
    key: 'READ_ORDERS',
    label: 'Read Orders',
    type: 'READ',
    sensitivity: 'INTERNAL',
    risk: 'LOW',
    description: 'Read order records: status, items, shipping and delivery dates.',
  },
  READ_CUSTOMER: {
    key: 'READ_CUSTOMER',
    label: 'Read Customers',
    type: 'READ',
    sensitivity: 'PII',
    risk: 'MEDIUM',
    description: 'Read customer profiles including name, email and address.',
  },
  WRITE_ORDERS: {
    key: 'WRITE_ORDERS',
    label: 'Write Orders',
    type: 'WRITE',
    sensitivity: 'INTERNAL',
    risk: 'MEDIUM',
    description: 'Modify existing order records (status, address, notes).',
  },
  DELETE_ORDERS: {
    key: 'DELETE_ORDERS',
    label: 'Delete Orders',
    type: 'DESTRUCTIVE',
    sensitivity: 'INTERNAL',
    risk: 'HIGH',
    description: 'Permanently delete order records. Irreversible.',
  },
  READ_PAYROLL: {
    key: 'READ_PAYROLL',
    label: 'Read Payroll',
    type: 'READ',
    sensitivity: 'HIGHLY_SENSITIVE',
    risk: 'HIGH',
    description: 'Read employee salary, bank and compensation data.',
  },
  READ_INVENTORY: {
    key: 'READ_INVENTORY',
    label: 'Read Inventory',
    type: 'READ',
    sensitivity: 'INTERNAL',
    risk: 'LOW',
    description: 'Read stock levels and warehouse availability.',
  },
  ISSUE_REFUND: {
    key: 'ISSUE_REFUND',
    label: 'Issue Refunds',
    type: 'WRITE',
    sensitivity: 'FINANCIAL',
    risk: 'HIGH',
    description: 'Move money back to a customer. Financially impactful.',
  },
};

/**
 * Tool catalogue. `permission` is the grant a tool requires to execute.
 */
export const TOOL_REGISTRY = {
  getOrder: {
    toolName: 'getOrder',
    label: 'Get Order',
    permission: 'READ_ORDERS',
    type: 'READ',
    risk: 'LOW',
    sensitivity: 'INTERNAL',
    description: 'Look up a single order by its order ID.',
    args: { orderId: 'string — the order number, e.g. "1024"' },
  },
  getCustomer: {
    toolName: 'getCustomer',
    label: 'Get Customer',
    permission: 'READ_CUSTOMER',
    type: 'READ',
    risk: 'MEDIUM',
    sensitivity: 'PII',
    description: 'Look up a customer profile by customer ID.',
    args: { customerId: 'string — the customer ID, e.g. "C-100"' },
  },
  getInventory: {
    toolName: 'getInventory',
    label: 'Get Inventory',
    permission: 'READ_INVENTORY',
    type: 'READ',
    risk: 'LOW',
    sensitivity: 'INTERNAL',
    description: 'Check stock level for a product SKU.',
    args: { sku: 'string — product SKU, e.g. "SKU-77"' },
  },
  updateOrder: {
    toolName: 'updateOrder',
    label: 'Update Order',
    permission: 'WRITE_ORDERS',
    type: 'WRITE',
    risk: 'MEDIUM',
    sensitivity: 'INTERNAL',
    description: 'Update fields on an existing order (status, shippingAddress, notes).',
    args: {
      orderId: 'string',
      status: 'string (optional)',
      shippingAddress: 'string (optional)',
      notes: 'string (optional)',
    },
  },
  deleteOrder: {
    toolName: 'deleteOrder',
    label: 'Delete Order',
    permission: 'DELETE_ORDERS',
    type: 'DESTRUCTIVE',
    risk: 'HIGH',
    sensitivity: 'INTERNAL',
    description: 'Permanently delete an order record. Destructive and irreversible.',
    args: { orderId: 'string' },
  },
  issueRefund: {
    toolName: 'issueRefund',
    label: 'Issue Refund',
    permission: 'ISSUE_REFUND',
    type: 'WRITE',
    risk: 'HIGH',
    sensitivity: 'FINANCIAL',
    description: 'Issue a monetary refund against an order.',
    args: { orderId: 'string', amount: 'number' },
  },
  getPayroll: {
    toolName: 'getPayroll',
    label: 'Get Payroll',
    permission: 'READ_PAYROLL',
    type: 'READ',
    risk: 'HIGH',
    sensitivity: 'HIGHLY_SENSITIVE',
    description: 'Read an employee payroll record including salary and bank details.',
    args: { employeeId: 'string — e.g. "E-01"' },
  },
};

export const ALL_TOOLS = Object.values(TOOL_REGISTRY);

export function toolsForPermissions(permissions = []) {
  const set = new Set(permissions);
  return ALL_TOOLS.filter((t) => set.has(t.permission));
}

export function permissionsForTools(toolNames = []) {
  return [
    ...new Set(
      toolNames.map((n) => TOOL_REGISTRY[n]?.permission).filter(Boolean)
    ),
  ];
}

export function permissionMeta(key) {
  return PERMISSIONS[key] ?? {
    key,
    label: key,
    type: 'UNKNOWN',
    sensitivity: 'UNKNOWN',
    risk: 'MEDIUM',
    description: 'Unregistered permission.',
  };
}
