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
} from '../models/sandbox.js';

/**
 * Raw sandbox tool implementations. These hit real MongoDB collections,
 * but only the fake demo collections seeded by `npm run seed`.
 *
 * NOTE: these functions contain NO permission logic. Authorization is
 * applied by executeTool() in enforcement.js so it cannot be bypassed by
 * an LLM/tool caller that tries to invoke implementations directly.
 */

export const implementations = {
  async getOrder({ orderId }) {
    const order = await Order.findOne({ orderId: String(orderId) }).lean();
    if (!order) return { found: false, message: `No order found with ID ${orderId}.` };
    return pick(order, ['orderId', 'customerId', 'status', 'expectedDelivery', 'items', 'total', 'shippingAddress', 'notes']);
  },

  async getCustomer({ customerId }) {
    const c = await Customer.findOne({ customerId: String(customerId) }).lean();
    if (!c) return { found: false, message: `No customer found with ID ${customerId}.` };
    return pick(c, ['customerId', 'name', 'email', 'phone', 'address', 'tier']);
  },

  async updateOrder({ orderId, status, shippingAddress, notes }) {
    const patch = compact({ status, shippingAddress, notes });
    if (!Object.keys(patch).length) return { updated: false, message: 'No fields supplied to update.' };
    return updateOne(Order, { orderId: String(orderId) }, patch, 'orderId', orderId);
  },

  async deleteOrder({ orderId }) {
    const res = await Order.findOneAndDelete({ orderId: String(orderId) }).lean();
    if (!res) return { deleted: false, message: `No order found with ID ${orderId}.` };
    return { deleted: true, orderId: res.orderId, warning: 'Sandbox order permanently removed.' };
  },

  async getPayroll({ employeeId }) {
    const e = await employeeById(employeeId);
    if (!e) return { found: false, message: `No employee found with ID ${employeeId}.` };
    return pick(e, ['employeeId', 'name', 'role', 'department', 'salary', 'bankAccount', 'payCycle']);
  },

  async getEmployee({ employeeId = 'E-01' }) {
    const e = await employeeById(employeeId);
    if (!e) return { found: false, message: `No employee found with ID ${employeeId}.` };
    return pick(e, ['employeeId', 'name', 'email', 'role', 'department', 'manager']);
  },

  async getLeaveBalance({ employeeId = 'E-01' }) {
    const e = await employeeById(employeeId);
    if (!e) return { found: false, message: `No employee found with ID ${employeeId}.` };
    return pick(e, ['employeeId', 'name', 'leaveBalance', 'plannedLeave']);
  },

  async updateEmployee({ employeeId, role, department, manager }) {
    const patch = compact({ role, department, manager });
    if (!Object.keys(patch).length) return { updated: false, message: 'No fields supplied to update.' };
    return updateOne(Employee, { employeeId: String(employeeId) }, patch, 'employeeId', employeeId);
  },

  async deleteEmployee({ employeeId }) {
    const res = await Employee.findOneAndDelete({ employeeId: String(employeeId) }).lean();
    if (!res) return { deleted: false, message: `No employee found with ID ${employeeId}.` };
    return { deleted: true, employeeId: res.employeeId, warning: 'Sandbox employee record removed.' };
  },

  async getInvoice({ invoiceId }) {
    const invoice = await Invoice.findOne({ invoiceId: String(invoiceId) }).lean();
    if (!invoice) return { found: false, message: `No invoice found with ID ${invoiceId}.` };
    return pick(invoice, ['invoiceId', 'customerId', 'status', 'amount', 'dueDate', 'notes']);
  },

  async getPayment({ paymentId, invoiceId }) {
    const query = paymentId ? { paymentId: String(paymentId) } : { invoiceId: String(invoiceId) };
    const payment = await Payment.findOne(query).lean();
    if (!payment) return { found: false, message: 'No payment found for the supplied identifier.' };
    return pick(payment, ['paymentId', 'invoiceId', 'status', 'amount', 'paidAt', 'method']);
  },

  async updateInvoice({ invoiceId, status, dueDate, notes }) {
    const patch = compact({ status, dueDate, notes });
    if (!Object.keys(patch).length) return { updated: false, message: 'No fields supplied to update.' };
    return updateOne(Invoice, { invoiceId: String(invoiceId) }, patch, 'invoiceId', invoiceId);
  },

  async deleteInvoice({ invoiceId }) {
    const res = await Invoice.findOneAndDelete({ invoiceId: String(invoiceId) }).lean();
    if (!res) return { deleted: false, message: `No invoice found with ID ${invoiceId}.` };
    return { deleted: true, invoiceId: res.invoiceId, warning: 'Sandbox invoice removed.' };
  },

  async getEmployeeSalary({ employeeId }) {
    const e = await employeeById(employeeId);
    if (!e) return { found: false, message: `No employee found with ID ${employeeId}.` };
    return pick(e, ['employeeId', 'name', 'department', 'salary']);
  },

  async getProduct({ productId }) {
    const p = await Product.findOne({ productId: String(productId) }).lean();
    if (!p) return { found: false, message: `No product found with ID ${productId}.` };
    return pick(p, ['productId', 'name', 'category', 'price']);
  },

  async getStock({ productId }) {
    const p = await Product.findOne({ productId: String(productId) }).lean();
    if (!p) return { found: false, message: `No product found with ID ${productId}.` };
    return pick(p, ['productId', 'name', 'stock', 'warehouse']);
  },

  async updateStock({ productId, stock }) {
    return updateOne(Product, { productId: String(productId) }, { stock: Number(stock) }, 'productId', productId);
  },

  async deleteProduct({ productId }) {
    const res = await Product.findOneAndDelete({ productId: String(productId) }).lean();
    if (!res) return { deleted: false, message: `No product found with ID ${productId}.` };
    return { deleted: true, productId: res.productId, warning: 'Sandbox product removed.' };
  },

  async updateProductPrice({ productId, price }) {
    return updateOne(Product, { productId: String(productId) }, { price: Number(price) }, 'productId', productId);
  },

  async getCampaign({ campaignId, name }) {
    const campaign = await findCampaign({ campaignId, name });
    if (!campaign) return { found: false, message: 'No campaign found for the supplied identifier.' };
    return pick(campaign, ['campaignId', 'name', 'channel', 'status', 'budget', 'ownerEmployeeId', 'notes']);
  },

  async getCampaignMetrics({ campaignId, name }) {
    const campaign = await findCampaign({ campaignId, name });
    if (!campaign) return { found: false, message: 'No campaign found for the supplied identifier.' };
    const metrics = await CampaignMetric.findOne({ campaignId: campaign.campaignId }).lean();
    if (!metrics) return { found: false, message: `No metrics found for ${campaign.campaignId}.` };
    const roi = metrics.spend ? Number(((metrics.revenue - metrics.spend) / metrics.spend).toFixed(2)) : null;
    return { ...pick(campaign, ['campaignId', 'name']), ...pick(metrics, ['impressions', 'clicks', 'conversions', 'spend', 'revenue']), roi };
  },

  async updateCampaign({ campaignId, status, budget, notes }) {
    const patch = compact({ status, budget: budget === undefined ? undefined : Number(budget), notes });
    if (!Object.keys(patch).length) return { updated: false, message: 'No fields supplied to update.' };
    return updateOne(Campaign, { campaignId: String(campaignId) }, patch, 'campaignId', campaignId);
  },

  async deleteCampaign({ campaignId }) {
    const res = await Campaign.findOneAndDelete({ campaignId: String(campaignId) }).lean();
    if (!res) return { deleted: false, message: `No campaign found with ID ${campaignId}.` };
    return { deleted: true, campaignId: res.campaignId, warning: 'Sandbox campaign removed.' };
  },

  async getEmployeeData({ employeeId }) {
    const e = await employeeById(employeeId);
    if (!e) return { found: false, message: `No employee found with ID ${employeeId}.` };
    return pick(e, ['employeeId', 'name', 'email', 'department', 'role']);
  },

  async getAppointment({ appointmentId, attendee, date }) {
    const query = {};
    if (appointmentId) query.appointmentId = String(appointmentId);
    if (attendee) query.attendee = new RegExp(escapeRegex(attendee), 'i');
    if (date) query.date = normalizeDate(date);
    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 }).lean();
    return { found: appointments.length > 0, appointments: appointments.map((a) => pick(a, ['appointmentId', 'attendee', 'date', 'time', 'topic', 'status'])) };
  },

  async getAvailableSlots({ date }) {
    const query = date ? { date: normalizeDate(date) } : {};
    const slots = await AvailableSlot.find(query).sort({ date: 1, time: 1 }).lean();
    return { found: slots.length > 0, slots: slots.map((s) => pick(s, ['slotId', 'date', 'time', 'provider'])) };
  },

  async createAppointment({ attendee, date, time, topic }) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const appointment = await Appointment.create({
      appointmentId: `APT-${suffix}`,
      attendee,
      date: normalizeDate(date),
      time,
      topic,
      status: 'Scheduled',
    });
    return { created: true, ...pick(appointment.toObject(), ['appointmentId', 'attendee', 'date', 'time', 'topic', 'status']) };
  },

  async updateAppointment({ appointmentId, date, time, status, topic }) {
    const patch = compact({ date: date ? normalizeDate(date) : undefined, time, status, topic });
    if (!Object.keys(patch).length) return { updated: false, message: 'No fields supplied to update.' };
    return updateOne(Appointment, { appointmentId: String(appointmentId) }, patch, 'appointmentId', appointmentId);
  },

  async deleteAppointment({ appointmentId }) {
    const res = await Appointment.findOneAndDelete({ appointmentId: String(appointmentId) }).lean();
    if (!res) return { deleted: false, message: `No appointment found with ID ${appointmentId}.` };
    return { deleted: true, appointmentId: res.appointmentId, warning: 'Sandbox appointment removed.' };
  },

  // Compatibility tools from the earlier demo.
  async getInventory({ sku }) {
    const i = await Inventory.findOne({ sku: String(sku) }).lean();
    if (!i) return { found: false, message: `No SKU ${sku} in inventory.` };
    return pick(i, ['sku', 'name', 'stock', 'warehouse']);
  },

  async issueRefund({ orderId, amount }) {
    const order = await Order.findOne({ orderId: String(orderId) });
    if (!order) return { refunded: false, message: `No order found with ID ${orderId}.` };
    const amt = Number(amount) || 0;
    order.refundedAmount = (order.refundedAmount || 0) + amt;
    await order.save();
    return { refunded: true, orderId: order.orderId, amount: amt, totalRefunded: order.refundedAmount };
  },
};

function compact(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== ''));
}

function pick(doc, keys) {
  return { found: true, ...Object.fromEntries(keys.map((key) => [key, doc[key]])) };
}

async function updateOne(Model, query, patch, idField, idValue) {
  const updated = await Model.findOneAndUpdate(query, { $set: patch }, { new: true }).lean();
  if (!updated) return { updated: false, message: `No record found with ${idField} ${idValue}.` };
  return { updated: true, [idField]: updated[idField], applied: patch };
}

function employeeById(employeeId = 'E-01') {
  return Employee.findOne({ employeeId: String(employeeId) }).lean();
}

async function findCampaign({ campaignId, name }) {
  if (campaignId) return Campaign.findOne({ campaignId: String(campaignId) }).lean();
  if (name) return Campaign.findOne({ name: new RegExp(escapeRegex(name), 'i') }).lean();
  return Campaign.findOne({ name: /summer/i }).lean();
}

function normalizeDate(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (raw === 'today') return new Date().toISOString().slice(0, 10);
  return String(value);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
