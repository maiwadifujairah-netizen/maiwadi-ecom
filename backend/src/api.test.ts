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
const { Order, Settings } = await import('./models/index.js');
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
  const cancel = await call(`/orders/${order.body.order._id}/cancel`, { method: 'POST', cookie, body: { reason: 'Customer request' } });
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
  process.env.ONLINE_PAYMENTS = 'true'; // legacy online checkout, switched off by default
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
  assert.equal((await call(`/orders/${id}`, { method: 'PATCH', cookie, body: { paymentStatus: 'failed' } })).status, 400); // gateway decides
  assert.equal((await call(`/orders/${id}`, { method: 'PATCH', body: { paymentStatus: 'failed' } })).status, 401);
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
  for (const s of ['Confirmed', 'Processing', 'Out for Delivery']) await call(`/orders/${c1.body.order._id}`, { method: 'PATCH', cookie, body: { status: s } });
  const delivered = await call(`/orders/${c1.body.order._id}`, { method: 'PATCH', cookie, body: { status: 'Delivered' } });
  assert.equal(delivered.body.status, 'Delivered');
  assert.equal((await call(`/orders/${c1.body.order._id}/collect-cash`, { method: 'POST', cookie })).body.paymentStatus, 'paid');
  delete process.env.ONLINE_PAYMENTS;
});

// ---------- Cash on Delivery: the only checkout method by default ----------
test('COD workflow: checkout validation, order record, admin lifecycle, filters', async () => {
  const cookie = (await call('/auth/login', { method: 'POST', body: { email: 'admin@test.com', password: 'supersecret1' } })).cookie;
  const product = (await call('/products', { method: 'POST', cookie, body: { name: 'COD Can', price: 7.5, stock: 6, images: [] } })).body;
  const stock = async () => (await call(`/products/${product.slug}`)).body.product.stock;
  await Settings.updateOne({ key: 'site' }, { deliveryFee: 5 }, { upsert: true });
  const body = (checkoutId: string, quantity = 2) => ({
    checkoutId,
    customer: { name: 'Fatima Khan', email: 'fatima@test.com', phone: '0501234567' },
    address: { line1: 'Villa 9, Al Faseel', city: 'Fujairah', state: 'Fujairah', notes: 'Call before arriving' },
    items: [{ productId: product._id, quantity }],
  });
  const place = (b: object) => call('/orders', { method: 'POST', body: b });

  // only COD is offered, even though Razorpay keys are configured
  assert.deepEqual((await call('/orders/payment-config')).body, { methods: ['cod'], razorpayKeyId: null });
  assert.equal((await place({ ...body('cod-online-try1'), paymentMethod: 'razorpay' })).status, 400);

  // validation: bad phone, empty address, out of stock; none of these touch stock
  assert.equal((await place({ ...body('cod-bad-phone-1'), customer: { ...body('x').customer, phone: 'abc' } })).status, 400);
  assert.equal((await place({ ...body('cod-no-address'), address: { ...body('x').address, line1: '' } })).status, 400);
  assert.equal((await place(body('cod-too-many-1', 7))).status, 409);
  assert.equal(await stock(), 6);

  // failed order creation: stock reservation is rolled back
  const create = Order.create;
  Order.create = (async () => { throw new Error('simulated DB failure'); }) as unknown as typeof Order.create;
  const failed = await place(body('cod-db-failure1'));
  Order.create = create;
  assert.equal(failed.status, 500);
  assert.equal(await stock(), 6);

  // place order (paymentMethod omitted = COD); totals computed on the server
  const before = Date.now();
  const placed = await place({ ...body('cod-happy-path1'), total: 1 });
  assert.equal(placed.status, 201);
  const o = placed.body.order;
  assert.match(o.orderNumber, /^MW-\d{8}-[0-9A-F]{6}$/);
  assert.deepEqual([o.paymentMethod, o.paymentStatus, o.status], ['cod', 'pending', 'Pending']);
  assert.deepEqual([o.subtotal, o.deliveryFee, o.total], [15, 5, 20]);
  assert.equal(o.address.notes, 'Call before arriving');
  assert.ok(Math.abs(new Date(o.createdAt).getTime() - before) < 5000);
  assert.equal(await stock(), 4);

  // duplicate submission returns the same order and doesn't reserve stock twice
  const dup = await place(body('cod-happy-path1'));
  assert.equal(dup.body.order._id, o._id);
  assert.equal(await stock(), 4);

  // saved in MongoDB with createdAt from the database
  const saved = await Order.findById(o._id).lean();
  assert.equal(saved!.paymentMethod, 'cod');
  assert.equal(saved!.createdAt.toISOString(), o.createdAt);

  // admin list: search by order number / name / phone, filters, newest first
  const list = (q: string) => call(`/orders?${q}`, { cookie }).then((r) => r.body);
  assert.equal((await list(`search=${o.orderNumber}`)).items[0]._id, o._id);
  assert.equal((await list('search=fatima')).items[0]._id, o._id);
  assert.equal((await list('search=0501234567')).total, 1);
  assert.equal((await list('paymentMethod=cod&status=Pending&paymentStatus=pending&search=fatima')).total, 1);
  const uaeToday = new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 10);
  assert.equal((await list(`from=${uaeToday}&to=${uaeToday}&search=fatima`)).total, 1);
  assert.equal((await list('from=2000-01-01&to=2000-01-02')).total, 0);
  const all = (await list('limit=50')).items.map((x: { createdAt: string }) => x.createdAt);
  assert.deepEqual(all, [...all].sort().reverse());

  // status workflow: forward only; cash can't be collected before delivery; payment can't be set by hand
  const patch = (b: object, id = o._id) => call(`/orders/${id}`, { method: 'PATCH', cookie, body: b });
  const act = (id: string, action: 'cancel' | 'collect-cash', b?: object) => call(`/orders/${id}/${action}`, { method: 'POST', cookie, body: b });
  const confirmed = await patch({ status: 'Confirmed', note: 'Called customer' });
  assert.equal(confirmed.body.status, 'Confirmed');
  assert.equal((await patch({ status: 'Pending' })).status, 400); // no going back
  assert.equal((await patch({ status: 'Confirmed' })).status, 400); // no duplicate update
  assert.equal((await patch({ status: 'Cancelled' })).status, 400); // cancelling needs the cancel action + reason
  assert.equal((await patch({ status: 'Processing' })).body.status, 'Processing');
  assert.equal((await patch({ status: 'Out for Delivery' })).body.status, 'Out for Delivery');
  assert.equal((await act(o._id, 'collect-cash')).status, 400);
  assert.equal((await patch({ paymentStatus: 'paid' })).status, 400); // the dropdown bypass is gone
  assert.equal((await patch({ status: 'Delivered' })).body.status, 'Delivered');
  assert.equal((await patch({ status: 'Out for Delivery' })).status, 400);
  assert.equal((await Order.findById(o._id).lean())!.paymentStatus, 'pending'); // delivered but cash not yet confirmed
  const paid = await act(o._id, 'collect-cash');
  assert.equal(paid.body.paymentStatus, 'paid');
  assert.equal((await act(o._id, 'collect-cash')).status, 409); // can't collect twice

  // delivered orders can't be cancelled (no false restock); a return is noted for manual review instead
  assert.equal((await act(o._id, 'cancel', { reason: 'Customer returned it' })).status, 400);
  assert.equal(await stock(), 4);
  assert.equal((await patch({ note: 'Return requested — manual review' })).status, 200);
  assert.equal((await patch({ paymentStatus: 'refunded', note: 'Cash returned' })).body.paymentStatus, 'refunded');

  // reload from the database: everything persisted, with an audit trail
  const detail = (await call(`/orders/${o._id}`, { cookie })).body;
  assert.deepEqual([detail.status, detail.paymentStatus, detail.createdAt, detail.orderNumber], ['Delivered', 'refunded', o.createdAt, o.orderNumber]);
  assert.ok(detail.paidAt);
  const collected = detail.statusHistory.find((h: { note: string }) => h.note === 'Cash collected — payment marked Paid');
  assert.ok(collected.by && collected.at); // which admin confirmed the cash, and when
  assert.equal(detail.statusHistory[1].note, 'Called customer');
  assert.deepEqual(detail.statusHistory.map((h: { status: string }) => h.status), ['Pending', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Delivered', 'Delivered', 'Delivered']);
  assert.ok(detail.statusHistory.every((h: { status: string; by: string }) => h.status === 'Pending' || h.by));

  // cancel before delivery: needs a reason; two simultaneous cancels -> one wins, stock restored exactly once
  const c = (await place(body('cod-cancel-test1', 2))).body.order;
  assert.equal(await stock(), 2);
  assert.equal((await patch({ status: 'Out for Delivery' }, c._id)).status, 400); // no skipping steps
  for (const st of ['Confirmed', 'Processing', 'Out for Delivery']) assert.equal((await patch({ status: st }, c._id)).status, 200);
  assert.equal((await act(c._id, 'cancel', { reason: '' })).status, 400);
  const [a1, a2] = await Promise.all([act(c._id, 'cancel', { reason: 'Customer not reachable' }), act(c._id, 'cancel', { reason: 'Customer not reachable' })]);
  assert.deepEqual([a1.status, a2.status].sort(), [200, 409]);
  assert.equal(await stock(), 4);
  assert.equal((await act(c._id, 'cancel', { reason: 'again' })).status, 409);
  assert.equal(await stock(), 4);
  const cdetail = (await call(`/orders/${c._id}`, { cookie })).body;
  assert.deepEqual([cdetail.status, cdetail.paymentStatus], ['Cancelled', 'cancelled']);
  const ch = cdetail.statusHistory.at(-1);
  assert.deepEqual([ch.status, ch.note], ['Cancelled', 'Cancelled while out for delivery: Customer not reachable']);
  assert.ok(ch.by && ch.at);
  assert.equal(cdetail.statusHistory.filter((h: { status: string }) => h.status === 'Cancelled').length, 1);
  // cancelled orders are final: can't be paid, delivered or reopened
  assert.equal((await act(c._id, 'collect-cash')).status, 400);
  assert.equal((await patch({ status: 'Delivered' }, c._id)).status, 400);
  assert.equal((await patch({ status: 'Processing' }, c._id)).status, 400);
  assert.equal((await patch({ paymentStatus: 'refunded' }, c._id)).status, 400);
  // two admins move the same order at once (quick status menu in two tabs): exactly one update lands
  const q = (await place(body('cod-race-update1', 1))).body.order;
  const [u1, u2] = await Promise.all([patch({ status: 'Confirmed', note: '' }, q._id), patch({ status: 'Confirmed', note: '' }, q._id)]);
  // the loser gets 409 (lost the atomic claim) or 400 (read the order after it was already Confirmed)
  assert.ok([u1.status, u2.status].includes(200) && [u1.status, u2.status].some((x) => x === 409 || x === 400));
  const qd = (await call(`/orders/${q._id}`, { cookie })).body;
  assert.deepEqual([qd.status, qd.paymentStatus, qd.statusHistory.filter((h: { status: string }) => h.status === 'Confirmed').length], ['Confirmed', 'pending', 1]);
  // payment dropdown: unpaid COD -> Failed (order status untouched, audited); not twice, not refundable, not on paid orders
  assert.equal((await patch({ paymentStatus: 'failed' }, o._id)).status, 400); // o is refunded
  const codFailed = await patch({ paymentStatus: 'failed' }, q._id);
  assert.deepEqual([codFailed.body.status, codFailed.body.paymentStatus], ['Confirmed', 'failed']);
  assert.ok(codFailed.body.statusHistory.at(-1).by);
  assert.equal((await patch({ paymentStatus: 'failed' }, q._id)).status, 400);
  assert.equal((await patch({ paymentStatus: 'refunded' }, q._id)).status, 400);
  assert.equal((await patch({ paymentStatus: 'pending' }, q._id)).status, 400); // not a settable value
  assert.equal((await act(q._id, 'collect-cash')).status, 400); // still not delivered
  await act(q._id, 'cancel', { reason: 'Test cleanup' });

  // "Hide completed orders": cancelled and delivered+settled orders are hidden from the view, never deleted;
  // delivered-but-unpaid stays visible (cash still to collect)
  const unpaidDelivered = (await place(body('cod-hide-test-01', 1))).body.order;
  for (const st of ['Confirmed', 'Processing', 'Out for Delivery', 'Delivered']) await patch({ status: st }, unpaidDelivered._id);
  const open = (await list('hideCompleted=1&limit=50')).items.map((x: { _id: string }) => x._id);
  assert.ok(open.includes(unpaidDelivered._id));
  assert.ok(!open.includes(o._id) && !open.includes(c._id)); // refunded delivered + cancelled
  assert.ok((await list('limit=50')).items.some((x: { _id: string }) => x._id === o._id)); // still in "all"
  await patch({ status: 'Delivered' }, unpaidDelivered._id).then((r) => assert.equal(r.status, 400)); // no duplicate
  await act(unpaidDelivered._id, 'collect-cash');
  const stockBefore = await stock();
  assert.equal((await act(unpaidDelivered._id, 'cancel', { reason: 'too late' })).status, 400); // delivered: no restock
  assert.equal(await stock(), stockBefore);

  // customer sees the cancellation in Account -> Orders (guest order here, so check via a signed-in one)
  const cust = (await call('/auth/register', { method: 'POST', body: { name: 'Mona', email: 'mona@test.com', password: 'password123' } })).cookie;
  const mine = (await call('/orders', { method: 'POST', cookie: cust, body: body('cod-account-test', 1) })).body.order;
  await act(mine._id, 'cancel', { reason: 'Ordered twice' });
  const history = (await call('/orders/mine', { cookie: cust })).body;
  assert.deepEqual([history[0].orderNumber, history[0].status, history[0].paymentStatus, history[0].paymentMethod], [mine.orderNumber, 'Cancelled', 'cancelled', 'cod']);
  assert.equal(await stock(), 3); // the delivered order above keeps its unit

  // older orders saved as 'Shipped' still show under Out for Delivery
  await Order.collection.updateOne({ _id: new mongoose.Types.ObjectId(c._id) }, { $set: { status: 'Shipped' } });
  assert.ok((await list('status=Out for Delivery&limit=50')).items.some((x: { _id: string }) => x._id === c._id));
});
