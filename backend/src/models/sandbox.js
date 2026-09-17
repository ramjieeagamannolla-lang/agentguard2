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
    role: String,
    department: String,
    salary: Number,
    bankAccount: String,
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

export const Order = mongoose.model('Order', OrderSchema);
export const Customer = mongoose.model('Customer', CustomerSchema);
export const Employee = mongoose.model('Employee', EmployeeSchema);
export const Inventory = mongoose.model('Inventory', InventorySchema);
