/**
 * Centralized permission + tool registry.
 *
 * This is the single source of truth for "what tools exist, what permission
 * each one demands, and how dangerous it is". Both the target agent runtime
 * and the AgentGuard audit graph read from here, so the auditor is always
 * reasoning about the same metadata the runtime enforces.
 */

export const PERMISSIONS = {
  READ_ORDERS: permission('READ_ORDERS', 'Read Orders', 'READ', 'INTERNAL', 'LOW',
    'Read order records: status, items, shipping and delivery dates.'),
  READ_CUSTOMER: permission('READ_CUSTOMER', 'Read Customers', 'READ', 'PII', 'MEDIUM',
    'Read customer profiles including name, email and address.'),
  WRITE_ORDERS: permission('WRITE_ORDERS', 'Write Orders', 'WRITE', 'INTERNAL', 'MEDIUM',
    'Modify existing order records such as status, address and notes.'),
  DELETE_ORDERS: permission('DELETE_ORDERS', 'Delete Orders', 'DESTRUCTIVE', 'INTERNAL', 'HIGH',
    'Permanently delete order records. Irreversible in the sandbox database.'),
  READ_PAYROLL: permission('READ_PAYROLL', 'Read Payroll', 'READ', 'HIGHLY_SENSITIVE', 'HIGH',
    'Read employee salary, bank and compensation data.'),

  READ_EMPLOYEE: permission('READ_EMPLOYEE', 'Read Employees', 'READ', 'PII', 'MEDIUM',
    'Read employee profiles including role, department and work contact details.'),
  READ_LEAVE: permission('READ_LEAVE', 'Read Leave', 'READ', 'INTERNAL', 'LOW',
    'Read employee leave balances and planned leave.'),
  WRITE_EMPLOYEE: permission('WRITE_EMPLOYEE', 'Write Employees', 'WRITE', 'PII', 'MEDIUM',
    'Modify employee profile fields such as role, department or manager.'),
  DELETE_EMPLOYEE: permission('DELETE_EMPLOYEE', 'Delete Employees', 'DESTRUCTIVE', 'PII', 'HIGH',
    'Remove an employee record from the sandbox HR directory.'),

  READ_INVOICES: permission('READ_INVOICES', 'Read Invoices', 'READ', 'FINANCIAL', 'MEDIUM',
    'Read invoice status, amounts, customer references and due dates.'),
  READ_PAYMENTS: permission('READ_PAYMENTS', 'Read Payments', 'READ', 'FINANCIAL', 'MEDIUM',
    'Read payment records and settlement status.'),
  WRITE_INVOICES: permission('WRITE_INVOICES', 'Write Invoices', 'WRITE', 'FINANCIAL', 'HIGH',
    'Modify invoice status, due date, notes or amount.'),
  DELETE_INVOICES: permission('DELETE_INVOICES', 'Delete Invoices', 'DESTRUCTIVE', 'FINANCIAL', 'HIGH',
    'Delete invoice records from the sandbox finance system.'),
  READ_SALARY: permission('READ_SALARY', 'Read Salary', 'READ', 'HIGHLY_SENSITIVE', 'HIGH',
    'Read employee salary data without broader payroll details.'),

  READ_PRODUCTS: permission('READ_PRODUCTS', 'Read Products', 'READ', 'INTERNAL', 'LOW',
    'Read product catalogue details such as name, category and price.'),
  READ_STOCK: permission('READ_STOCK', 'Read Stock', 'READ', 'INTERNAL', 'LOW',
    'Read product stock levels and warehouse availability.'),
  WRITE_STOCK: permission('WRITE_STOCK', 'Write Stock', 'WRITE', 'INTERNAL', 'MEDIUM',
    'Modify product stock counts in the sandbox inventory system.'),
  DELETE_PRODUCTS: permission('DELETE_PRODUCTS', 'Delete Products', 'DESTRUCTIVE', 'INTERNAL', 'HIGH',
    'Delete product catalogue records from the sandbox inventory system.'),
  WRITE_PRICES: permission('WRITE_PRICES', 'Write Prices', 'WRITE', 'FINANCIAL', 'HIGH',
    'Modify product prices and commercial catalogue data.'),

  READ_CAMPAIGNS: permission('READ_CAMPAIGNS', 'Read Campaigns', 'READ', 'INTERNAL', 'LOW',
    'Read marketing campaign configuration and status.'),
  READ_CAMPAIGN_METRICS: permission('READ_CAMPAIGN_METRICS', 'Read Campaign Metrics', 'READ', 'INTERNAL', 'LOW',
    'Read campaign impressions, clicks, conversions, spend and revenue.'),
  WRITE_CAMPAIGNS: permission('WRITE_CAMPAIGNS', 'Write Campaigns', 'WRITE', 'INTERNAL', 'MEDIUM',
    'Modify campaign budget, status, channel or notes.'),
  DELETE_CAMPAIGNS: permission('DELETE_CAMPAIGNS', 'Delete Campaigns', 'DESTRUCTIVE', 'INTERNAL', 'HIGH',
    'Delete campaign records from the sandbox marketing system.'),
  READ_EMPLOYEE_DATA: permission('READ_EMPLOYEE_DATA', 'Read Employee Data', 'READ', 'PII', 'MEDIUM',
    'Read limited employee data used for campaign ownership and staffing context.'),

  READ_APPOINTMENTS: permission('READ_APPOINTMENTS', 'Read Appointments', 'READ', 'PII', 'MEDIUM',
    'Read appointment details, attendees, topics and schedules.'),
  READ_SLOTS: permission('READ_SLOTS', 'Read Available Slots', 'READ', 'INTERNAL', 'LOW',
    'Read available appointment slots.'),
  CREATE_APPOINTMENTS: permission('CREATE_APPOINTMENTS', 'Create Appointments', 'WRITE', 'PII', 'MEDIUM',
    'Create new appointments in the sandbox scheduling system.'),
  WRITE_APPOINTMENTS: permission('WRITE_APPOINTMENTS', 'Write Appointments', 'WRITE', 'PII', 'MEDIUM',
    'Modify appointment details or status.'),
  DELETE_APPOINTMENTS: permission('DELETE_APPOINTMENTS', 'Delete Appointments', 'DESTRUCTIVE', 'PII', 'HIGH',
    'Delete appointments from the sandbox scheduling system.'),

  // Kept for compatibility with earlier demo agents.
  READ_INVENTORY: permission('READ_INVENTORY', 'Read Inventory', 'READ', 'INTERNAL', 'LOW',
    'Read stock levels and warehouse availability.'),
  ISSUE_REFUND: permission('ISSUE_REFUND', 'Issue Refunds', 'WRITE', 'FINANCIAL', 'HIGH',
    'Move money back to a customer. Financially impactful.'),
};

/**
 * Tool catalogue. `permission` is the grant a tool requires to execute.
 */
export const TOOL_REGISTRY = {
  getOrder: toolSpec('getOrder', 'Get Order', 'READ_ORDERS', 'READ', 'LOW', 'INTERNAL',
    'Look up a single order by its order ID.', { orderId: 'string, e.g. "1024"' }),
  getCustomer: toolSpec('getCustomer', 'Get Customer', 'READ_CUSTOMER', 'READ', 'MEDIUM', 'PII',
    'Look up a customer profile by customer ID.', { customerId: 'string, e.g. "C-100"' }),
  updateOrder: toolSpec('updateOrder', 'Update Order', 'WRITE_ORDERS', 'WRITE', 'MEDIUM', 'INTERNAL',
    'Update fields on an existing order.', { orderId: 'string', status: 'string (optional)', shippingAddress: 'string (optional)', notes: 'string (optional)' }),
  deleteOrder: toolSpec('deleteOrder', 'Delete Order', 'DELETE_ORDERS', 'DESTRUCTIVE', 'HIGH', 'INTERNAL',
    'Permanently delete an order record.', { orderId: 'string' }),
  getPayroll: toolSpec('getPayroll', 'Get Payroll', 'READ_PAYROLL', 'READ', 'HIGH', 'HIGHLY_SENSITIVE',
    'Read an employee payroll record including salary and bank details.', { employeeId: 'string, e.g. "E-01"' }),

  getEmployee: toolSpec('getEmployee', 'Get Employee', 'READ_EMPLOYEE', 'READ', 'MEDIUM', 'PII',
    'Look up an employee profile by employee ID.', { employeeId: 'string, e.g. "E-01"; defaults to "E-01" for "my" questions' }),
  getLeaveBalance: toolSpec('getLeaveBalance', 'Get Leave Balance', 'READ_LEAVE', 'READ', 'LOW', 'INTERNAL',
    'Check remaining leave balance for an employee.', { employeeId: 'string, e.g. "E-01"; defaults to "E-01" for "my" questions' }),
  updateEmployee: toolSpec('updateEmployee', 'Update Employee', 'WRITE_EMPLOYEE', 'WRITE', 'MEDIUM', 'PII',
    'Update sandbox employee profile fields.', { employeeId: 'string', role: 'string (optional)', department: 'string (optional)', manager: 'string (optional)' }),
  deleteEmployee: toolSpec('deleteEmployee', 'Delete Employee', 'DELETE_EMPLOYEE', 'DESTRUCTIVE', 'HIGH', 'PII',
    'Delete an employee record from sandbox HR data.', { employeeId: 'string' }),

  getInvoice: toolSpec('getInvoice', 'Get Invoice', 'READ_INVOICES', 'READ', 'MEDIUM', 'FINANCIAL',
    'Look up an invoice by invoice ID.', { invoiceId: 'string, e.g. "INV-1001"' }),
  getPayment: toolSpec('getPayment', 'Get Payment', 'READ_PAYMENTS', 'READ', 'MEDIUM', 'FINANCIAL',
    'Look up a payment by payment ID or invoice ID.', { paymentId: 'string (optional)', invoiceId: 'string (optional)' }),
  updateInvoice: toolSpec('updateInvoice', 'Update Invoice', 'WRITE_INVOICES', 'WRITE', 'HIGH', 'FINANCIAL',
    'Update sandbox invoice fields.', { invoiceId: 'string', status: 'string (optional)', dueDate: 'string (optional)', notes: 'string (optional)' }),
  deleteInvoice: toolSpec('deleteInvoice', 'Delete Invoice', 'DELETE_INVOICES', 'DESTRUCTIVE', 'HIGH', 'FINANCIAL',
    'Delete an invoice from sandbox finance data.', { invoiceId: 'string' }),
  getEmployeeSalary: toolSpec('getEmployeeSalary', 'Get Employee Salary', 'READ_SALARY', 'READ', 'HIGH', 'HIGHLY_SENSITIVE',
    'Read salary for an employee without broader payroll details.', { employeeId: 'string, e.g. "E-03"' }),

  getProduct: toolSpec('getProduct', 'Get Product', 'READ_PRODUCTS', 'READ', 'LOW', 'INTERNAL',
    'Look up product catalogue details by product ID.', { productId: 'string, e.g. "P100"' }),
  getStock: toolSpec('getStock', 'Get Stock', 'READ_STOCK', 'READ', 'LOW', 'INTERNAL',
    'Check product stock by product ID.', { productId: 'string, e.g. "P100"' }),
  updateStock: toolSpec('updateStock', 'Update Stock', 'WRITE_STOCK', 'WRITE', 'MEDIUM', 'INTERNAL',
    'Update stock quantity for a product.', { productId: 'string', stock: 'number' }),
  deleteProduct: toolSpec('deleteProduct', 'Delete Product', 'DELETE_PRODUCTS', 'DESTRUCTIVE', 'HIGH', 'INTERNAL',
    'Delete a product from the sandbox catalogue.', { productId: 'string' }),
  updateProductPrice: toolSpec('updateProductPrice', 'Update Product Price', 'WRITE_PRICES', 'WRITE', 'HIGH', 'FINANCIAL',
    'Update product price in the sandbox catalogue.', { productId: 'string', price: 'number' }),

  getCampaign: toolSpec('getCampaign', 'Get Campaign', 'READ_CAMPAIGNS', 'READ', 'LOW', 'INTERNAL',
    'Look up campaign setup by campaign ID or name.', { campaignId: 'string (optional)', name: 'string (optional)' }),
  getCampaignMetrics: toolSpec('getCampaignMetrics', 'Get Campaign Metrics', 'READ_CAMPAIGN_METRICS', 'READ', 'LOW', 'INTERNAL',
    'Analyze performance metrics for a campaign.', { campaignId: 'string (optional)', name: 'string (optional)' }),
  updateCampaign: toolSpec('updateCampaign', 'Update Campaign', 'WRITE_CAMPAIGNS', 'WRITE', 'MEDIUM', 'INTERNAL',
    'Update sandbox campaign fields.', { campaignId: 'string', status: 'string (optional)', budget: 'number (optional)', notes: 'string (optional)' }),
  deleteCampaign: toolSpec('deleteCampaign', 'Delete Campaign', 'DELETE_CAMPAIGNS', 'DESTRUCTIVE', 'HIGH', 'INTERNAL',
    'Delete a campaign from sandbox marketing data.', { campaignId: 'string' }),
  getEmployeeData: toolSpec('getEmployeeData', 'Get Employee Data', 'READ_EMPLOYEE_DATA', 'READ', 'MEDIUM', 'PII',
    'Read limited employee data for campaign staffing or ownership context.', { employeeId: 'string, e.g. "E-02"' }),

  getAppointment: toolSpec('getAppointment', 'Get Appointment', 'READ_APPOINTMENTS', 'READ', 'MEDIUM', 'PII',
    'Look up appointments by appointment ID, attendee or date.', { appointmentId: 'string (optional)', attendee: 'string (optional)', date: 'string (optional, accepts "tomorrow")' }),
  getAvailableSlots: toolSpec('getAvailableSlots', 'Get Available Slots', 'READ_SLOTS', 'READ', 'LOW', 'INTERNAL',
    'Find available appointment slots.', { date: 'string (optional, accepts "tomorrow")' }),
  createAppointment: toolSpec('createAppointment', 'Create Appointment', 'CREATE_APPOINTMENTS', 'WRITE', 'MEDIUM', 'PII',
    'Create a sandbox appointment.', { attendee: 'string', date: 'string', time: 'string', topic: 'string' }),
  updateAppointment: toolSpec('updateAppointment', 'Update Appointment', 'WRITE_APPOINTMENTS', 'WRITE', 'MEDIUM', 'PII',
    'Update sandbox appointment details.', { appointmentId: 'string', date: 'string (optional)', time: 'string (optional)', status: 'string (optional)', topic: 'string (optional)' }),
  deleteAppointment: toolSpec('deleteAppointment', 'Delete Appointment', 'DELETE_APPOINTMENTS', 'DESTRUCTIVE', 'HIGH', 'PII',
    'Delete an appointment from sandbox scheduling data.', { appointmentId: 'string' }),

  // Kept for compatibility with earlier demo agents.
  getInventory: toolSpec('getInventory', 'Get Inventory', 'READ_INVENTORY', 'READ', 'LOW', 'INTERNAL',
    'Check stock level for a product SKU.', { sku: 'string, e.g. "SKU-77"' }),
  issueRefund: toolSpec('issueRefund', 'Issue Refund', 'ISSUE_REFUND', 'WRITE', 'HIGH', 'FINANCIAL',
    'Issue a monetary refund against an order.', { orderId: 'string', amount: 'number' }),
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

function permission(key, label, type, sensitivity, risk, description) {
  return { key, label, type, sensitivity, risk, description };
}

function toolSpec(toolName, label, permissionKey, type, risk, sensitivity, description, args) {
  return { toolName, label, permission: permissionKey, type, risk, sensitivity, description, args };
}
