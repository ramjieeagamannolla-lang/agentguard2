import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { Order, Customer, Employee, Inventory } from './models/sandbox.js';
import { Agent } from './models/Agent.js';
import { Audit } from './models/Audit.js';
import { ToolCallLog } from './models/ToolCallLog.js';
import { permissionsForTools } from './permissions/registry.js';

const customers = [
  { customerId: 'C-100', name: 'John Mathews', email: 'john.m@example.com', phone: '+1-555-0100', address: '14 Oak Street, Austin, TX', tier: 'Gold' },
  { customerId: 'C-101', name: 'Priya Nair', email: 'priya.n@example.com', phone: '+91-98450-11223', address: '221 MG Road, Bengaluru', tier: 'Silver' },
  { customerId: 'C-102', name: 'Diego Ramirez', email: 'diego.r@example.com', phone: '+34-600-112-233', address: 'Calle Mayor 8, Madrid', tier: 'Bronze' },
];

const orders = [
  {
    orderId: '1024', customerId: 'C-100', status: 'Shipped', expectedDelivery: 'Tomorrow',
    items: [{ sku: 'SKU-77', name: 'Noise Cancelling Headphones', qty: 1, price: 249 }],
    total: 249, shippingAddress: '14 Oak Street, Austin, TX', notes: 'Leave at front door.',
  },
  {
    orderId: '1025', customerId: 'C-101', status: 'Processing', expectedDelivery: 'In 4 days',
    items: [{ sku: 'SKU-12', name: 'Mechanical Keyboard', qty: 2, price: 129 }],
    total: 258, shippingAddress: '221 MG Road, Bengaluru', notes: '',
  },
  {
    orderId: '1026', customerId: 'C-102', status: 'Delivered', expectedDelivery: 'Delivered 3 days ago',
    items: [{ sku: 'SKU-31', name: '27" 4K Monitor', qty: 1, price: 399 }],
    total: 399, shippingAddress: 'Calle Mayor 8, Madrid', notes: 'Signed for by recipient.',
  },
  {
    orderId: '1027', customerId: 'C-100', status: 'Cancelled', expectedDelivery: 'N/A',
    items: [{ sku: 'SKU-12', name: 'Mechanical Keyboard', qty: 1, price: 129 }],
    total: 129, shippingAddress: '14 Oak Street, Austin, TX', notes: 'Cancelled by customer.',
  },
];

const employees = [
  { employeeId: 'E-01', name: 'Sarah Chen', role: 'Engineering Manager', department: 'Engineering', salary: 168000, bankAccount: 'XXXX-XXXX-4412' },
  { employeeId: 'E-02', name: 'Marcus Webb', role: 'Support Lead', department: 'Customer Success', salary: 94000, bankAccount: 'XXXX-XXXX-9087' },
  { employeeId: 'E-03', name: 'Aisha Rahman', role: 'Financial Analyst', department: 'Finance', salary: 112000, bankAccount: 'XXXX-XXXX-2231' },
];

const inventory = [
  { sku: 'SKU-77', name: 'Noise Cancelling Headphones', stock: 42, warehouse: 'WH-EAST' },
  { sku: 'SKU-12', name: 'Mechanical Keyboard', stock: 8, warehouse: 'WH-WEST' },
  { sku: 'SKU-31', name: '27" 4K Monitor', stock: 0, warehouse: 'WH-EAST' },
];

const demoAgents = [
  {
    name: 'Customer Support Agent',
    task: 'Answer customer questions about orders, shipping and delivery.',
    description: 'Front-line support agent embedded in the help widget.',
    tools: ['getOrder', 'getCustomer', 'updateOrder', 'deleteOrder', 'getPayroll'],
  },
  {
    name: 'HR Assistant',
    task: 'Help employees find information about their payroll and compensation.',
    description: 'Internal HR helpdesk assistant.',
    tools: ['getPayroll', 'getCustomer'],
  },
  {
    name: 'Inventory Assistant',
    task: 'Report current stock levels for products to the warehouse team.',
    description: 'Warehouse-facing stock lookup agent.',
    tools: ['getInventory'],
  },
];

async function run() {
  await connectDB();

  const reset = process.argv.includes('--reset');

  await Promise.all([
    Order.deleteMany({}), Customer.deleteMany({}),
    Employee.deleteMany({}), Inventory.deleteMany({}),
  ]);
  await Order.insertMany(orders);
  await Customer.insertMany(customers);
  await Employee.insertMany(employees);
  await Inventory.insertMany(inventory);
  console.log('[seed] sandbox data loaded (orders, customers, employees, inventory)');

  if (reset) {
    await Promise.all([Agent.deleteMany({}), Audit.deleteMany({}), ToolCallLog.deleteMany({})]);
    console.log('[seed] cleared agents, audits and tool logs (--reset)');
  }

  if ((await Agent.countDocuments()) === 0) {
    for (const a of demoAgents) {
      const permissions = permissionsForTools(a.tools);
      await Agent.create({
        ...a,
        grantedPermissions: permissions,
        originalPermissions: permissions,
        status: 'UNAUDITED',
        riskLevel: 'UNKNOWN',
      });
    }
    console.log(`[seed] created ${demoAgents.length} demo agents`);
  } else {
    console.log('[seed] agents already exist — left untouched (use --reset to wipe)');
  }

  await mongoose.disconnect();
  console.log('[seed] done.');
}

run().catch((e) => {
  console.error('[seed] failed:', e);
  process.exit(1);
});
