// End-to-end API check against an in-memory MongoDB: `npm test`
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
// Fake Razorpay keys: the gateway is stubbed below, so nothing reaches Razorpay
Object.assign(process.env, { MONGODB_URI: mongo.getUri(), JWT_SECRET: 'test-secret', ADMIN_EMAIL: 'admin@test.com', ADMIN_PASSWORD: 'supersecret1', NODE_ENV: 'test', RAZORPAY_KEY_ID: 'rzp_test_fake', RAZORPAY_KEY_SECRET: 'fake_secret' });
const { connectDB } = await import('./config/db.js');
const { seed } = await import('./seed.js');
const { createApp } = await import('./app.js');
const mongoose = (await import('mongoose')).default;
const { gateway } = await import('./services/payment.js');
const { Order } = await import('./models/index.js');
const crypto = await import('node:crypto');

await connectDB(mongo.getUri());
await seed();
const server = createApp().listen(0);
const base = `http://localhost:${(server.address() as { port: number }).port}/api`;
after(async () => { server.close(); await mongoose.disconnect(); await mongo.stop(); });

async function call(path: string, opts: { method?: string; body?: unknown; cookie?: string } = {}) {
  const res = await fetch(base + path, {
    method: opts.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(opts.cookie && { cookie: opts.cookie }) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, body: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0] };
}

const checkout = (productId: string, quantity: number) => ({
  customer: { name: 'Test Buyer', email: 'b@test.com', phone: '+971 50 000 0000' },
  address: { line1: 'Villa 1, Street 2', city: 'Fujairah', state: 'Fujairah', postalCode: '' },
  items: [{ productId, quantity }],
  paymentMethod: 'cod',
});

test('full storefront + admin flow', async () => {
  // seeded product is visible but not orderable until admin sets a price
  const list = await call('/products');
  assert.equal(list.body.items.length, 1);
  const seeded = list.body.items[0];
  assert.equal((await call('/orders', { method: 'POST', body: checkout(seeded._id, 1) })).status, 400);

  // admin routes are protected
  assert.equal((await call('/products/admin')).status, 401);
  assert.equal((await call('/admin/dashboard')).status, 401);
  const cust = await call('/auth/register', { method: 'POST', body: { name: 'Cust', email: 'c@test.com', password: 'password123' } });
  assert.equal((await call('/admin/dashboard', { cookie: cust.cookie })).status, 403);

  const admin = await call('/auth/login', { method: 'POST', body: { email: 'admin@test.com', password: 'supersecret1' } });
  assert.equal(admin.status, 200);
  const cookie = admin.cookie;

  // admin sets price/stock and adds a second product
  const upd = await call(`/products/${seeded._id}`, { method: 'PUT', cookie, body: { ...seeded, category: seeded.category._id, price: 12.5, stock: 5 } });
  assert.equal(upd.status, 200);
  const created = await call('/products', { method: 'POST', cookie, body: { name: 'Small Bottle Pack', price: 20, stock: 3, images: [] } });
  assert.equal(created.status, 201);
  assert.equal((await call('/products')).body.items.length, 2);
  assert.equal((await call('/products/small-bottle-pack')).body.product.name, 'Small Bottle Pack');

  // order: server-side totals and stock reservation, oversell rejected
  const order = await call('/orders', { method: 'POST', cookie: cust.cookie, body: checkout(seeded._id, 2) });
  assert.equal(order.status, 201);
  assert.equal(order.body.order.subtotal, 25);
  assert.equal((await call('/orders', { method: 'POST', body: checkout(seeded._id, 4) })).status, 409);
  assert.equal((await call('/orders/mine', { cookie: cust.cookie })).body.length, 1);

  // cancelling restores stock
  const cancel = await call(`/orders/${order.body.order._id}`, { method: 'PATCH', cookie, body: { status: 'Cancelled' } });
  assert.equal(cancel.body.status, 'Cancelled');
  assert.equal((await call(`/products/${seeded.slug}`)).body.product.stock, 5);

  // delete product
  assert.equal((await call(`/products/${created.body._id}`, { method: 'DELETE', cookie })).status, 200);
  assert.equal((await call('/products')).body.items.length, 1);

  // banners: only active ones are public
  await call('/banners', { method: 'POST', cookie, body: { title: 'Summer offer', image: '/images/truck.jpg', isActive: false } });
  assert.equal((await call('/banners')).body.length, 0);

  // contact inquiry saved and visible to admin
  assert.equal((await call('/contact', { method: 'POST', body: { name: 'Ali', email: 'ali@test.com', message: 'Please deliver 5 cans weekly.' } })).status, 201);
  assert.equal((await call('/contact', { cookie })).body.total, 1);

  const dash = await call('/admin/dashboard', { cookie });
  assert.equal(dash.body.orders, 1);
  assert.equal(dash.body.customers, 1);
  assert.equal(dash.body.sales.total, 0); // cancelled order excluded
});

// ---------- Payments: Razorpay stubbed in memory ----------
type P = { id: string; order_id: string; status: string; amount: number; currency: string };
const rzp = { orders: 0, payments: new Map<string, P>() };
gateway.createOrder = async (amount) => ({ id: `order_T${++rzp.orders}`, amount });
gateway.fetchPayment = async (id) => { const p = rzp.payments.get(id); if (!p) throw new Error('payment not found'); return p; };
gateway.orderPayments = async (orderId) => [...rzp.payments.values()].filter((p) => p.order_id === orderId);
gateway.capture = async (id) => ({ ...rzp.payments.get(id)!, status: 'captured' });
const sign = (orderId: string, paymentId: string) => crypto.createHmac('sha256', 'fake_secret').update(`${orderId}|${paymentId}`).digest('hex');

test('checkout: idempotency, Razorpay verification, retries, COD, expiry, admin', async () => {
  const cookie = (await call('/auth/login', { method: 'POST', body: { email: 'admin@test.com', password: 'supersecret1' } })).cookie;
  const product = (await call('/products', { method: 'POST', cookie, body: { name: 'Pay Test Can', price: 10, stock: 10, images: [] } })).body;
  const stock = async () => (await call(`/products/${product.slug}`)).body.product.stock;
  const order = (checkoutId: string, quantity: number, paymentMethod: string, extra = {}) =>
    call('/orders', { method: 'POST', body: { ...checkout(product._id, quantity), checkoutId, paymentMethod, ...extra } });

  assert.deepEqual((await call('/orders/payment-config')).body.methods, ['cod', 'razorpay']);

  // COD: double submit of the same checkout = one order, stock reserved once; never marked paid
  const c1 = await order('checkout-cod-0001', 2, 'cod');
  assert.equal(c1.status, 201);
  assert.equal(c1.body.payment, null);
  assert.equal(c1.body.order.paymentStatus, 'pending');
  const c1again = await order('checkout-cod-0001', 2, 'cod');
  assert.equal(c1again.body.order._id, c1.body.order._id);
  assert.equal(await stock(), 8);

  // Client-sent prices/totals are ignored
  const tampered = await order('checkout-tamper-01', 1, 'cod', { total: 0.01, items: [{ productId: product._id, quantity: 1, price: 0.01 }] });
  assert.equal(tampered.body.order.total, 10);
  assert.equal(tampered.body.order.address.state, 'Fujairah');

  // Razorpay: server-made order with server amount (minor units); retry reuses it
  const r1 = await order('checkout-rzp-00001', 3, 'razorpay');
  assert.equal(r1.status, 201);
  const { razorpayOrderId, amount } = r1.body.payment;
  assert.equal(amount, 3000);
  const retry = await order('checkout-rzp-00001', 3, 'razorpay');
  assert.equal(retry.body.payment.razorpayOrderId, razorpayOrderId);
  assert.equal(rzp.orders, 1);
  assert.equal(await stock(), 4); // 10 - 2 (cod) - 1 (tamper) - 3 (rzp), reserved once
  const id = r1.body.order._id;
  const verify = (body: object) => call(`/orders/${id}/verify-payment`, { method: 'POST', body });

  // forged signature: rejected, order untouched
  const forged = await verify({ razorpay_order_id: razorpayOrderId, razorpay_payment_id: 'pay_X', razorpay_signature: 'deadbeef' });
  assert.equal(forged.status, 400);
  // valid signature but the payment failed at Razorpay
  rzp.payments.set('pay_fail', { id: 'pay_fail', order_id: razorpayOrderId, status: 'failed', amount: 3000, currency: 'AED' });
  assert.equal((await verify({ razorpay_order_id: razorpayOrderId, razorpay_payment_id: 'pay_fail', razorpay_signature: sign(razorpayOrderId, 'pay_fail') })).status, 402);
  // valid signature but wrong amount
  rzp.payments.set('pay_low', { id: 'pay_low', order_id: razorpayOrderId, status: 'captured', amount: 100, currency: 'AED' });
  assert.equal((await verify({ razorpay_order_id: razorpayOrderId, razorpay_payment_id: 'pay_low', razorpay_signature: sign(razorpayOrderId, 'pay_low') })).status, 402);
  // admin cannot hand-mark an unverified online payment as paid
  assert.equal((await call(`/orders/${id}`, { method: 'PATCH', cookie, body: { paymentStatus: 'paid' } })).status, 400);
  assert.equal((await call(`/orders/${id}`, { cookie })).body.paymentStatus, 'pending');

  // genuine payment (authorized -> captured by the server); duplicate callback is harmless
  rzp.payments.set('pay_ok', { id: 'pay_ok', order_id: razorpayOrderId, status: 'authorized', amount: 3000, currency: 'AED' });
  const good = { razorpay_order_id: razorpayOrderId, razorpay_payment_id: 'pay_ok', razorpay_signature: sign(razorpayOrderId, 'pay_ok') };
  const ok = await verify(good);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.order.paymentStatus, 'paid');
  assert.equal(ok.body.order.status, 'Confirmed');
  assert.equal(ok.body.order.razorpayPaymentId, 'pay_ok');
  const dup = await verify(good);
  assert.equal(dup.status, 200);
  assert.equal(dup.body.order.statusHistory.filter((h: { status: string }) => h.status === 'Confirmed').length, 1);
  // resubmitting a paid checkout returns the paid order, no new payment
  assert.equal((await order('checkout-rzp-00001', 3, 'razorpay')).body.payment, null);

  // dismissed payment -> customer switches the same checkout to cash on delivery
  const r2 = await order('checkout-rzp-00002', 1, 'razorpay');
  const switched = await order('checkout-rzp-00002', 1, 'cod');
  assert.equal(switched.body.order._id, r2.body.order._id);
  assert.equal(switched.body.order.paymentMethod, 'cod');
  assert.equal(switched.body.order.paymentStatus, 'pending');

  // paid but the browser never called back: admin view recovers it from Razorpay
  const r3 = await order('checkout-rzp-00003', 1, 'razorpay');
  rzp.payments.set('pay_late', { id: 'pay_late', order_id: r3.body.payment.razorpayOrderId, status: 'captured', amount: 1000, currency: 'AED' });
  const recovered = await call(`/orders/${r3.body.order._id}`, { cookie });
  assert.equal(recovered.body.paymentStatus, 'paid');
  assert.equal(recovered.body.razorpayPaymentId, 'pay_late');

  // abandoned online order: stock comes back after the payment window
  const before = await stock();
  const r4 = await order('checkout-rzp-00004', 2, 'razorpay');
  assert.equal(await stock(), before - 2);
  // raw driver: Mongoose treats createdAt as immutable
  await Order.collection.updateOne({ _id: new mongoose.Types.ObjectId(r4.body.order._id) }, { $set: { createdAt: new Date(Date.now() - 31 * 60 * 1000) } });
  await order('checkout-cod-0002', 1, 'cod'); // any checkout sweeps stale orders
  assert.equal((await call(`/orders/${r4.body.order._id}`, { cookie })).body.status, 'Cancelled');
  assert.equal(await stock(), before - 1);
  // the same checkout id can start over after expiry
  assert.equal((await order('checkout-rzp-00004', 1, 'razorpay')).status, 201);

  // admin: filters, search by payment id, COD can be marked paid by hand, guests blocked
  assert.equal((await call('/orders')).status, 401);
  const paidList = (await call('/orders?paymentStatus=paid&paymentMethod=razorpay', { cookie })).body;
  assert.equal(paidList.total, 2);
  assert.equal((await call('/orders?search=pay_ok', { cookie })).body.items[0]._id, id);
  const shipped = await call(`/orders/${c1.body.order._id}`, { method: 'PATCH', cookie, body: { status: 'Shipped', paymentStatus: 'paid' } });
  assert.equal(shipped.body.status, 'Shipped');
  assert.equal(shipped.body.paymentStatus, 'paid');
});
