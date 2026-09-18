import mongoose from 'mongoose';

/* ------------------------------------------------------------------ *
 * SANDBOX DATA ONLY.
 * These collections are fake company data used by the target agent's
 * tools. Nothing here touches a real system.
 * ------------------------------------------------------------------ */

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, index: true },
    customerId: String,
    items: [{ sku: String, name: String, qty: Number, price: Number }],
    total: Number,
    status: String,
    expectedDelivery: String,
    shippingAddress: String,
    notes: String,
    refundedAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CustomerSchema = new mongoose.Schema(
  {
    customerId: { type: String, unique: true, index: true },
    name: String,
    email: String,
    phone: String,
    address: String,
    tier: String,
  },
  { timestamps: true }
);

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true, index: true },
    name: String,
    email: String,
    role: String,
    department: String,
    manager: String,
    leaveBalance: Number,
    plannedLeave: [String],
    salary: Number,
    bankAccount: String,
    payCycle: String,
  },
  { timestamps: true }
);

const InventorySchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, index: true },
    name: String,
    stock: Number,
    warehouse: String,
  },
  { timestamps: true }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, unique: true, index: true },
    customerId: String,
    status: String,
    amount: Number,
    dueDate: String,
    notes: String,
  },
  { timestamps: true }
);

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, unique: true, index: true },
    invoiceId: { type: String, index: true },
    status: String,
    amount: Number,
    paidAt: String,
    method: String,
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true, index: true },
    name: String,
    category: String,
    price: Number,
    stock: Number,
    warehouse: String,
  },
  { timestamps: true }
);

const CampaignSchema = new mongoose.Schema(
  {
    campaignId: { type: String, unique: true, index: true },
    name: { type: String, index: true },
    channel: String,
    status: String,
    budget: Number,
    ownerEmployeeId: String,
    notes: String,
  },
  { timestamps: true }
);

const CampaignMetricSchema = new mongoose.Schema(
  {
    campaignId: { type: String, index: true },
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spend: Number,
    revenue: Number,
  },
  { timestamps: true }
);

const AppointmentSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, unique: true, index: true },
    attendee: String,
    date: { type: String, index: true },
    time: String,
    topic: String,
    status: String,
  },
  { timestamps: true }
);

const AvailableSlotSchema = new mongoose.Schema(
  {
    slotId: { type: String, unique: true, index: true },
    date: { type: String, index: true },
    time: String,
    provider: String,
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', OrderSchema);
export const Customer = mongoose.model('Customer', CustomerSchema);
export const Employee = mongoose.model('Employee', EmployeeSchema);
export const Inventory = mongoose.model('Inventory', InventorySchema);
export const Invoice = mongoose.model('Invoice', InvoiceSchema);
export const Payment = mongoose.model('Payment', PaymentSchema);
export const Product = mongoose.model('Product', ProductSchema);
export const Campaign = mongoose.model('Campaign', CampaignSchema);
export const CampaignMetric = mongoose.model('CampaignMetric', CampaignMetricSchema);
export const Appointment = mongoose.model('Appointment', AppointmentSchema);
export const AvailableSlot = mongoose.model('AvailableSlot', AvailableSlotSchema);
