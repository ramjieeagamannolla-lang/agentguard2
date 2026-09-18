import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import {
  Order,
  Customer,
  Employee,
  Inventory,
  Invoice,
  Payment,
  Product,
  Campaign,
  CampaignMetric,
  Appointment,
  AvailableSlot,
} from './models/sandbox.js';
import { Agent } from './models/Agent.js';
import { Audit } from './models/Audit.js';
import { ToolCallLog } from './models/ToolCallLog.js';
import { permissionsForTools } from './permissions/registry.js';
import { AGENT_TEMPLATES } from './agents/templates.js';

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
  {
    employeeId: 'E-01', name: 'Sarah Chen', email: 'sarah.chen@example.test',
    role: 'Engineering Manager', department: 'Engineering', manager: 'Dana Lee',
    leaveBalance: 12, plannedLeave: ['2026-10-07', '2026-10-08'],
    salary: 168000, bankAccount: 'XXXX-XXXX-4412', payCycle: 'Semi-monthly',
  },
  {
    employeeId: 'E-02', name: 'Marcus Webb', email: 'marcus.webb@example.test',
    role: 'Support Lead', department: 'Customer Success', manager: 'Nora Patel',
    leaveBalance: 7, plannedLeave: ['2026-11-21'],
    salary: 94000, bankAccount: 'XXXX-XXXX-9087', payCycle: 'Semi-monthly',
  },
  {
    employeeId: 'E-03', name: 'Aisha Rahman', email: 'aisha.rahman@example.test',
    role: 'Financial Analyst', department: 'Finance', manager: 'Riley Chen',
    leaveBalance: 15, plannedLeave: [],
    salary: 112000, bankAccount: 'XXXX-XXXX-2231', payCycle: 'Semi-monthly',
  },
];

const inventory = [
  { sku: 'SKU-77', name: 'Noise Cancelling Headphones', stock: 42, warehouse: 'WH-EAST' },
  { sku: 'SKU-12', name: 'Mechanical Keyboard', stock: 8, warehouse: 'WH-WEST' },
  { sku: 'SKU-31', name: '27" 4K Monitor', stock: 0, warehouse: 'WH-EAST' },
];

const invoices = [
  { invoiceId: 'INV-1001', customerId: 'C-100', status: 'Open', amount: 249, dueDate: '2026-09-30', notes: 'Awaiting payment.' },
  { invoiceId: 'INV-1002', customerId: 'C-101', status: 'Paid', amount: 258, dueDate: '2026-09-10', notes: 'Paid in full.' },
];

const payments = [
  { paymentId: 'PAY-9001', invoiceId: 'INV-1001', status: 'Pending', amount: 249, paidAt: '', method: 'ACH' },
  { paymentId: 'PAY-9002', invoiceId: 'INV-1002', status: 'Settled', amount: 258, paidAt: '2026-09-08', method: 'Card' },
];

const products = [
  { productId: 'P100', name: 'Noise Cancelling Headphones', category: 'Audio', price: 249, stock: 42, warehouse: 'WH-EAST' },
  { productId: 'P200', name: 'Mechanical Keyboard', category: 'Accessories', price: 129, stock: 8, warehouse: 'WH-WEST' },
  { productId: 'P300', name: '27 Inch 4K Monitor', category: 'Displays', price: 399, stock: 0, warehouse: 'WH-EAST' },
];

const campaigns = [
  { campaignId: 'CMP-2026-SUMMER', name: 'Summer Launch', channel: 'Email + Paid Social', status: 'Completed', budget: 18000, ownerEmployeeId: 'E-02', notes: 'Seasonal acquisition push.' },
  { campaignId: 'CMP-2026-FALL', name: 'Fall Retention', channel: 'Email', status: 'Planning', budget: 9000, ownerEmployeeId: 'E-01', notes: 'Loyalty nurture campaign.' },
];

const campaignMetrics = [
  { campaignId: 'CMP-2026-SUMMER', impressions: 240000, clicks: 15600, conversions: 820, spend: 17650, revenue: 68400 },
  { campaignId: 'CMP-2026-FALL', impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const todayIso = today.toISOString().slice(0, 10);
const tomorrowIso = tomorrow.toISOString().slice(0, 10);

const appointments = [
  { appointmentId: 'APT-1001', attendee: 'Sarah Chen', date: todayIso, time: '10:00', topic: 'Project sync', status: 'Scheduled' },
  { appointmentId: 'APT-1002', attendee: 'Sarah Chen', date: tomorrowIso, time: '14:30', topic: 'Benefits review', status: 'Scheduled' },
  { appointmentId: 'APT-1003', attendee: 'Marcus Webb', date: tomorrowIso, time: '09:00', topic: 'Support staffing', status: 'Scheduled' },
];

const availableSlots = [
  { slotId: 'SLOT-1', date: todayIso, time: '15:00', provider: 'HR Desk' },
  { slotId: 'SLOT-2', date: tomorrowIso, time: '11:00', provider: 'HR Desk' },
  { slotId: 'SLOT-3', date: tomorrowIso, time: '16:00', provider: 'Finance Desk' },
];

const demoAgents = [AGENT_TEMPLATES[0]];

async function run() {
  await connectDB();

  const reset = process.argv.includes('--reset');

  await Promise.all([
    Order.deleteMany({}), Customer.deleteMany({}),
    Employee.deleteMany({}), Inventory.deleteMany({}),
    Invoice.deleteMany({}), Payment.deleteMany({}),
    Product.deleteMany({}), Campaign.deleteMany({}), CampaignMetric.deleteMany({}),
    Appointment.deleteMany({}), AvailableSlot.deleteMany({}),
  ]);
  await Order.insertMany(orders);
  await Customer.insertMany(customers);
  await Employee.insertMany(employees);
  await Inventory.insertMany(inventory);
  await Invoice.insertMany(invoices);
  await Payment.insertMany(payments);
  await Product.insertMany(products);
  await Campaign.insertMany(campaigns);
  await CampaignMetric.insertMany(campaignMetrics);
  await Appointment.insertMany(appointments);
  await AvailableSlot.insertMany(availableSlots);
  console.log('[seed] sandbox data loaded for support, HR, finance, inventory, marketing and appointments');

  if (reset) {
    await Promise.all([Agent.deleteMany({}), Audit.deleteMany({}), ToolCallLog.deleteMany({})]);
    console.log('[seed] cleared agents, audits and tool logs (--reset)');
  }

  if ((await Agent.countDocuments()) === 0) {
    for (const a of demoAgents) {
      const permissions = permissionsForTools(a.tools);
      await Agent.create({
        ...a,
        type: a.type,
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
