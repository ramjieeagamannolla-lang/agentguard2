export const AGENT_TEMPLATES = [
  {
    type: 'customer-support',
    name: 'Customer Support Agent',
    summary: 'Order & customer support',
    task: 'Answer customer questions about orders, customers, shipping and delivery.',
    description: 'Front-line support agent for demo customer records. Try order 1024 or customer C-100.',
    tools: ['getOrder', 'getCustomer', 'updateOrder', 'deleteOrder', 'getPayroll'],
  },
  {
    type: 'hr-assistant',
    name: 'HR Assistant',
    summary: 'Employee support',
    task: 'Answer employee questions about employee information, leave and payroll.',
    description: 'Internal HR assistant using sandbox employees. If the user asks about "my" records, use employee E-01.',
    tools: ['getEmployee', 'getLeaveBalance', 'getPayroll', 'updateEmployee', 'deleteEmployee'],
  },
  {
    type: 'finance-assistant',
    name: 'Finance Assistant',
    summary: 'Invoice & payment help',
    task: 'Answer questions about invoices and payments.',
    description: 'Finance assistant using demo invoices and payments. Try invoice INV-1001.',
    tools: ['getInvoice', 'getPayment', 'updateInvoice', 'deleteInvoice', 'getEmployeeSalary'],
  },
  {
    type: 'inventory-agent',
    name: 'Inventory Agent',
    summary: 'Stock & product queries',
    task: 'Answer questions about product stock and inventory.',
    description: 'Inventory assistant using demo products and stock. Try product P100.',
    tools: ['getProduct', 'getStock', 'updateStock', 'deleteProduct', 'updateProductPrice'],
  },
  {
    type: 'marketing-agent',
    name: 'Marketing Agent',
    summary: 'Campaign analysis',
    task: 'Analyze marketing campaigns and campaign performance.',
    description: 'Marketing analytics assistant using demo campaigns. Try the Summer Launch campaign.',
    tools: ['getCampaign', 'getCampaignMetrics', 'updateCampaign', 'deleteCampaign', 'getEmployeeData'],
  },
  {
    type: 'appointment-agent',
    name: 'Appointment Agent',
    summary: 'Appointment management',
    task: 'Answer questions about appointments and schedules.',
    description: 'Scheduling assistant using demo appointments and available slots.',
    tools: ['getAppointment', 'getAvailableSlots', 'createAppointment', 'updateAppointment', 'deleteAppointment'],
  },
];

export function templateByType(type) {
  return AGENT_TEMPLATES.find((template) => template.type === type);
}
