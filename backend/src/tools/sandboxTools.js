import { Order, Customer, Employee, Inventory } from '../models/sandbox.js';

/**
 * Raw sandbox tool implementations. These hit real MongoDB collections,
 * but only the fake demo collections seeded by `npm run seed`.
 *
 * NOTE: these functions contain NO permission logic. Authorization is
 * applied by the guard in toolFactory.js so it cannot be bypassed by a
 * caller that imports these directly by accident — see enforcement.js,
 * which is the only sanctioned entry point.
 */

export const implementations = {
  async getOrder({ orderId }) {
    const order = await Order.findOne({ orderId: String(orderId) }).lean();
    if (!order) return { found: false, message: `No order found with ID ${orderId}.` };
    return {
      found: true,
      orderId: order.orderId,
      customerId: order.customerId,
      status: order.status,
      expectedDelivery: order.expectedDelivery,
      items: order.items,
      total: order.total,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
    };
  },

  async getCustomer({ customerId }) {
    const c = await Customer.findOne({ customerId: String(customerId) }).lean();
    if (!c) return { found: false, message: `No customer found with ID ${customerId}.` };
    return {
      found: true,
      customerId: c.customerId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      tier: c.tier,
    };
  },

  async getInventory({ sku }) {
    const i = await Inventory.findOne({ sku: String(sku) }).lean();
    if (!i) return { found: false, message: `No SKU ${sku} in inventory.` };
    return { found: true, sku: i.sku, name: i.name, stock: i.stock, warehouse: i.warehouse };
  },

  async updateOrder({ orderId, status, shippingAddress, notes }) {
    const patch = {};
    if (status !== undefined) patch.status = status;
    if (shippingAddress !== undefined) patch.shippingAddress = shippingAddress;
    if (notes !== undefined) patch.notes = notes;
    if (!Object.keys(patch).length) return { updated: false, message: 'No fields supplied to update.' };

    const order = await Order.findOneAndUpdate(
      { orderId: String(orderId) },
      { $set: patch },
      { new: true }
    ).lean();
    if (!order) return { updated: false, message: `No order found with ID ${orderId}.` };
    return { updated: true, orderId: order.orderId, applied: patch, status: order.status };
  },

  async deleteOrder({ orderId }) {
    const res = await Order.findOneAndDelete({ orderId: String(orderId) }).lean();
    if (!res) return { deleted: false, message: `No order found with ID ${orderId}.` };
    return { deleted: true, orderId: res.orderId, warning: 'Order permanently removed.' };
  },

  async issueRefund({ orderId, amount }) {
    const order = await Order.findOne({ orderId: String(orderId) });
    if (!order) return { refunded: false, message: `No order found with ID ${orderId}.` };
    const amt = Number(amount) || 0;
    order.refundedAmount = (order.refundedAmount || 0) + amt;
    await order.save();
    return { refunded: true, orderId: order.orderId, amount: amt, totalRefunded: order.refundedAmount };
  },

  async getPayroll({ employeeId }) {
    const e = await Employee.findOne({ employeeId: String(employeeId) }).lean();
    if (!e) return { found: false, message: `No employee found with ID ${employeeId}.` };
    return {
      found: true,
      employeeId: e.employeeId,
      name: e.name,
      role: e.role,
      department: e.department,
      salary: e.salary,
      bankAccount: e.bankAccount,
    };
  },
};
