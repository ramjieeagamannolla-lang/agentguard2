/** Mirrors the backend registry for display-only purposes. */
export const TOOL_LABELS = [
  { toolName: 'getOrder', label: 'Get Order', permission: 'READ_ORDERS' },
  { toolName: 'getCustomer', label: 'Get Customer', permission: 'READ_CUSTOMER' },
  { toolName: 'getInventory', label: 'Get Inventory', permission: 'READ_INVENTORY' },
  { toolName: 'updateOrder', label: 'Update Order', permission: 'WRITE_ORDERS' },
  { toolName: 'deleteOrder', label: 'Delete Order', permission: 'DELETE_ORDERS' },
  { toolName: 'issueRefund', label: 'Issue Refund', permission: 'ISSUE_REFUND' },
  { toolName: 'getPayroll', label: 'Get Payroll', permission: 'READ_PAYROLL' },
];
