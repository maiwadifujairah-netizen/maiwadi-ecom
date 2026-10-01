import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { Order, ORDER_STATUSES, PAYMENT_STATUSES, Product, Settings } from '../models/index.js';
import { createPaymentOrder, onlinePaymentEnabled, paymentMethods, verifyPaymentSignature } from '../services/payment.js';
import { reserveStock, restoreStock } from '../services/inventory.js';
import { env } from '../config/env.js';
import { HttpError, escapeRegex, paging, round2 } from '../utils/http.js';

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.email().max(120),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/, 'Enter a valid phone number'),
  }),
  address: z.object({
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2).max(80),
    area: z.string().trim().max(80).optional().default(''),
    notes: z.string().trim().max(500).optional().default(''),
  }),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().min(1).max(500) }))
    .min(1, 'Your cart is empty')
    .max(50),
  paymentMethod: z.enum(['cod', 'razorpay']),
});

const orderNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `MW-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

// Public: payment options available to the checkout page
export const paymentConfig = (_req: Request, res: Response) => {
  res.json({ methods: paymentMethods(), razorpayKeyId: onlinePaymentEnabled() ? env.razorpay.keyId : null });
};

// Place an order (guest or signed-in). Prices/stock are always taken from the DB, never the client.
export const placeOrder = async (req: Request, res: Response) => {
  const data = checkoutSchema.parse(req.body);
  if (data.paymentMethod === 'razorpay' && !onlinePaymentEnabled()) throw new HttpError(400, 'Online payment is not available');

  // merge duplicate lines
  const qty = new Map<string, number>();
  for (const i of data.items) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.quantity);

  const products = await Product.find({ _id: { $in: [...qty.keys()] }, isActive: true }).lean();
  if (products.length !== qty.size) throw new HttpError(400, 'Some items in your cart are no longer available');
  for (const p of products) {
    if (p.price <= 0) throw new HttpError(400, `${p.name} is not available for online ordering yet`);
    if (p.stock < qty.get(String(p._id))!) throw new HttpError(409, `Only ${p.stock} of ${p.name} left in stock`);
  }

  const reserved = await reserveStock(products.map((p) => ({ product: p._id, name: p.name, quantity: qty.get(String(p._id))! })));

  try {
    const settings = await Settings.findOne({ key: 'site' }).lean();
    const items = products.map((p) => ({ product: p._id, name: p.name, image: p.images[0] ?? '', price: p.price, quantity: qty.get(String(p._id))! }));
    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const deliveryFee = round2(settings?.deliveryFee ?? 0);
    const currency = settings?.currency ?? 'AED';

    const order = await Order.create({
      orderNumber: orderNumber(),
      user: req.user?._id ?? null,
      customer: data.customer,
      address: data.address,
      items,
      subtotal,
      deliveryFee,
      total: round2(subtotal + deliveryFee),
      currency,
      paymentMethod: data.paymentMethod,
      statusHistory: [{ status: 'Pending', note: 'Order placed' }],
    });

    let payment = null;
    if (data.paymentMethod === 'razorpay') {
      payment = await createPaymentOrder(order.total, currency, order.orderNumber);
      order.razorpayOrderId = payment.razorpayOrderId;
      await order.save();
    }
    res.status(201).json({ order, payment });
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }
};

// Verify Razorpay payment signature on the server — the only place an order becomes "paid"
export const verifyPayment = async (req: Request, res: Response) => {
  if (!onlinePaymentEnabled()) throw new HttpError(400, 'Online payment is not available');
  const body = z
    .object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() })
    .parse(req.body);
  const order = await Order.findById(req.params.id);
  if (!order || order.razorpayOrderId !== body.razorpay_order_id) throw new HttpError(404, 'Order not found');

  if (!verifyPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
    order.paymentStatus = 'failed';
    await order.save();
    throw new HttpError(400, 'Payment verification failed');
  }
  order.paymentStatus = 'paid';
  order.razorpayPaymentId = body.razorpay_payment_id;
  if (order.status === 'Pending') {
    order.status = 'Confirmed';
    order.statusHistory.push({ status: 'Confirmed', note: 'Payment received', at: new Date() });
  }
  await order.save();
  res.json({ order });
};

// Signed-in customer's own order history
export const myOrders = async (req: Request, res: Response) => {
  res.json(await Order.find({ user: req.user!._id }).sort({ createdAt: -1 }).lean());
};

// ---------- Admin ----------
export const listOrders = async (req: Request, res: Response) => {
  const { page, limit, skip } = paging(req.query);
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === 'string' && (ORDER_STATUSES as readonly string[]).includes(req.query.status)) filter.status = req.query.status;
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const s = escapeRegex(req.query.search.trim());
    filter.$or = [{ orderNumber: { $regex: s, $options: 'i' } }, { 'customer.name': { $regex: s, $options: 'i' } }, { 'customer.phone': { $regex: s } }];
  }
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
};

export const getOrder = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone').lean();
  if (!order) throw new HttpError(404, 'Order not found');
  res.json(order);
};

export const updateOrder = async (req: Request, res: Response) => {
  const data = z
    .object({ status: z.enum(ORDER_STATUSES).optional(), paymentStatus: z.enum(PAYMENT_STATUSES).optional(), note: z.string().max(300).optional() })
    .parse(req.body);
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status === 'Cancelled' && data.status && data.status !== 'Cancelled')
    throw new HttpError(400, 'Cancelled orders cannot be reopened');

  if (data.status && data.status !== order.status) {
    if (data.status === 'Cancelled') await restoreStock(order.items);
    order.status = data.status;
    order.statusHistory.push({ status: data.status, note: data.note ?? '', at: new Date() });
  }
  if (data.paymentStatus) order.paymentStatus = data.paymentStatus;
  await order.save();
  res.json(order);
};
