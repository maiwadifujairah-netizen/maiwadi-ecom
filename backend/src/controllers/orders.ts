import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { Order, ORDER_STATUSES, PAYMENT_STATUSES, Product, Settings } from '../models/index.js';
import { createPaymentOrder, gateway, onlinePaymentEnabled, paymentMethods, toMinor, verifyPaymentSignature, type GatewayPayment } from '../services/payment.js';
import { reserveStock, restoreStock } from '../services/inventory.js';
import { env } from '../config/env.js';
import { HttpError, escapeRegex, paging, round2 } from '../utils/http.js';

type OrderDoc = InstanceType<typeof Order>;

const checkoutSchema = z.object({
  // Generated once per checkout page; makes POST /orders safe to repeat
  checkoutId: z.string().trim().min(8).max(64).optional(),
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
    state: z.string().trim().max(80).optional().default(''), // required by the checkout form; optional here so older clients keep working
    postalCode: z.string().trim().max(12).regex(/^[A-Za-z\d\s-]*$/, 'Enter a valid postal code').optional().default(''),
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

/** Unpaid online orders hold stock this long; the checkout window closes itself after 15 minutes. */
export const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

const paymentInit = (o: OrderDoc) => ({ keyId: env.razorpay.keyId, razorpayOrderId: o.razorpayOrderId!, amount: toMinor(o.total), currency: o.currency });

/** Marks the order paid once (atomic), confirming it if it was still pending. */
async function markPaid(order: OrderDoc, paymentId: string) {
  const confirm = order.status === 'Pending';
  const note = order.status === 'Cancelled' ? 'Payment received after the order was cancelled — refund or contact the customer' : 'Payment received';
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: 'paid' } },
    {
      paymentStatus: 'paid',
      razorpayPaymentId: paymentId,
      ...(confirm && { status: 'Confirmed' }),
      $push: { statusHistory: { status: confirm ? 'Confirmed' : order.status, note, at: new Date() } },
    },
    { new: true },
  );
  return updated ?? (await Order.findById(order._id))!;
}

/** Trust Razorpay's own record, not the browser: right order, right amount and currency, and captured. */
async function settle(order: OrderDoc, p: GatewayPayment) {
  if (p.order_id !== order.razorpayOrderId || Number(p.amount) !== toMinor(order.total) || p.currency !== order.currency) return null;
  if (p.status === 'authorized') p = await gateway.capture(p.id, toMinor(order.total), order.currency); // accounts without auto-capture
  return p.status === 'captured' ? markPaid(order, p.id) : null;
}

/** Recovers payments whose browser callback never arrived (tab closed, network drop). Never throws. */
async function syncPayment(order: OrderDoc) {
  if (order.paymentMethod !== 'razorpay' || order.paymentStatus === 'paid' || !order.razorpayOrderId || !onlinePaymentEnabled()) return null;
  try {
    for (const p of await gateway.orderPayments(order.razorpayOrderId)) {
      const paid = await settle(order, p);
      if (paid) return paid;
    }
  } catch (err) {
    console.error(`Razorpay sync failed for ${order.orderNumber}:`, (err as Error).message);
  }
  return null;
}

/** Releases stock held by online orders that were never paid. */
// ponytail: swept on each checkout instead of a cron job; add a scheduler if stock must free up when nobody is ordering
async function expireStaleOrders() {
  const stale = await Order.find({ paymentMethod: 'razorpay', paymentStatus: { $ne: 'paid' }, status: 'Pending', createdAt: { $lt: new Date(Date.now() - PAYMENT_WINDOW_MS) } }).limit(20);
  for (const o of stale) {
    if (await syncPayment(o)) continue;
    const claimed = await Order.findOneAndUpdate(
      { _id: o._id, status: 'Pending', paymentStatus: { $ne: 'paid' } },
      { status: 'Cancelled', $unset: { checkoutId: 1 }, $push: { statusHistory: { status: 'Cancelled', note: 'Online payment not completed in time', at: new Date() } } },
    );
    if (claimed) await restoreStock(claimed.items);
  }
}

/** Same checkout submitted again: return the existing order instead of creating a duplicate. */
async function resume(order: OrderDoc, method: 'cod' | 'razorpay') {
  const unpaidOnline = order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid' && order.status !== 'Cancelled';
  if (!unpaidOnline) return { order, payment: null };
  const paid = await syncPayment(order);
  if (paid) return { order: paid, payment: null };
  if (method === 'razorpay') return { order, payment: paymentInit(order) }; // retry in the same Razorpay order
  // Customer gave up on paying online and chose cash on delivery for the same checkout
  order.paymentMethod = 'cod';
  order.statusHistory.push({ status: order.status, note: 'Switched to cash on delivery', at: new Date() });
  await order.save();
  return { order, payment: null };
}

// Public: payment options available to the checkout page
export const paymentConfig = (_req: Request, res: Response) => {
  res.json({ methods: paymentMethods(), razorpayKeyId: onlinePaymentEnabled() ? env.razorpay.keyId : null });
};

// Place an order (guest or signed-in). Prices/stock are always taken from the DB, never the client.
export const placeOrder = async (req: Request, res: Response) => {
  const data = checkoutSchema.parse(req.body);
  if (data.paymentMethod === 'razorpay' && !onlinePaymentEnabled()) throw new HttpError(400, 'Online payment is not available');

  await expireStaleOrders();
  if (data.checkoutId) {
    const existing = await Order.findOne({ checkoutId: data.checkoutId });
    if (existing) return res.json(await resume(existing, data.paymentMethod));
  }

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

  let order: OrderDoc | null = null;
  try {
    const settings = await Settings.findOne({ key: 'site' }).lean();
    const items = products.map((p) => ({ product: p._id, name: p.name, image: p.images[0] ?? '', price: p.price, quantity: qty.get(String(p._id))! }));
    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const deliveryFee = round2(settings?.deliveryFee ?? 0);
    const currency = settings?.currency ?? 'AED';

    order = await Order.create({
      orderNumber: orderNumber(),
      checkoutId: data.checkoutId,
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

    if (data.paymentMethod === 'razorpay') {
      order.razorpayOrderId = (await createPaymentOrder(order.total, currency, order.orderNumber)).razorpayOrderId;
      await order.save();
    }
    res.status(201).json({ order, payment: order.razorpayOrderId ? paymentInit(order) : null });
  } catch (err) {
    await restoreStock(reserved);
    if (order) await Order.deleteOne({ _id: order._id }); // payment gateway failed: don't leave a half-made order
    // Two simultaneous submits of the same checkout: the loser returns the winner's order
    if ((err as { code?: number }).code === 11000 && data.checkoutId) {
      const existing = await Order.findOne({ checkoutId: data.checkoutId });
      if (existing) return res.json(await resume(existing, data.paymentMethod));
    }
    throw err;
  }
};

// Razorpay checkout callback. The order becomes paid only when the signature is valid AND Razorpay
// confirms a captured payment for this order's exact amount.
export const verifyPayment = async (req: Request, res: Response) => {
  if (!onlinePaymentEnabled()) throw new HttpError(400, 'Online payment is not available');
  const body = z
    .object({ razorpay_order_id: z.string().min(1), razorpay_payment_id: z.string().min(1), razorpay_signature: z.string().min(1) })
    .parse(req.body);
  const order = await Order.findById(req.params.id);
  if (!order || order.razorpayOrderId !== body.razorpay_order_id) throw new HttpError(404, 'Order not found');
  if (order.paymentStatus === 'paid') return res.json({ order }); // duplicate callback

  if (!verifyPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature))
    throw new HttpError(400, 'Payment verification failed');
  const paid = await settle(order, await gateway.fetchPayment(body.razorpay_payment_id));
  if (!paid) throw new HttpError(402, 'Your payment was not completed. You have not been charged for this order — please try again.');
  res.json({ order: paid });
};

// Signed-in customer's own order history
export const myOrders = async (req: Request, res: Response) => {
  res.json(await Order.find({ user: req.user!._id }).sort({ createdAt: -1 }).lean());
};

// ---------- Admin ----------
export const listOrders = async (req: Request, res: Response) => {
  const { page, limit, skip } = paging(req.query);
  const filter: Record<string, unknown> = {};
  const { status, paymentStatus, paymentMethod, search } = req.query;
  if (typeof status === 'string' && (ORDER_STATUSES as readonly string[]).includes(status)) filter.status = status;
  if (typeof paymentStatus === 'string' && (PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)) filter.paymentStatus = paymentStatus;
  if (paymentMethod === 'cod' || paymentMethod === 'razorpay') filter.paymentMethod = paymentMethod;
  if (typeof search === 'string' && search.trim()) {
    const s = escapeRegex(search.trim());
    filter.$or = ['orderNumber', 'customer.name', 'customer.email', 'customer.phone', 'razorpayOrderId', 'razorpayPaymentId'].map((f) => ({ [f]: { $regex: s, $options: 'i' } }));
  }
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
};

export const getOrder = async (req: Request, res: Response) => {
  const found = await Order.findById(req.params.id);
  if (!found) throw new HttpError(404, 'Order not found');
  await syncPayment(found); // admin sees payments whose browser callback never arrived
  res.json(await Order.findById(found._id).populate('user', 'name email phone').lean());
};

export const updateOrder = async (req: Request, res: Response) => {
  const data = z
    .object({ status: z.enum(ORDER_STATUSES).optional(), paymentStatus: z.enum(PAYMENT_STATUSES).optional(), note: z.string().max(300).optional() })
    .parse(req.body);
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status === 'Cancelled' && data.status && data.status !== 'Cancelled')
    throw new HttpError(400, 'Cancelled orders cannot be reopened');
  // Online payments become "paid" only through Razorpay verification; cash orders are marked paid by hand
  if (data.paymentStatus === 'paid' && order.paymentMethod === 'razorpay' && !order.razorpayPaymentId)
    throw new HttpError(400, 'Online payments are marked paid automatically once Razorpay confirms them');

  if (data.status && data.status !== order.status) {
    if (data.status === 'Cancelled') await restoreStock(order.items);
    order.status = data.status;
    order.statusHistory.push({ status: data.status, note: data.note ?? '', at: new Date() });
  }
  if (data.paymentStatus) order.paymentStatus = data.paymentStatus;
  await order.save();
  res.json(order);
};
