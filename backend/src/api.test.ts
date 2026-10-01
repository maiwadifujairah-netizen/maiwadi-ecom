// End-to-end API check against an in-memory MongoDB: `npm test`
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
Object.assign(process.env, { MONGODB_URI: mongo.getUri(), JWT_SECRET: 'test-secret', ADMIN_EMAIL: 'admin@test.com', ADMIN_PASSWORD: 'supersecret1', NODE_ENV: 'test' });
const { connectDB } = await import('./config/db.js');
const { seed } = await import('./seed.js');
const { createApp } = await import('./app.js');
const mongoose = (await import('mongoose')).default;

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
  address: { line1: 'Villa 1, Street 2', city: 'Fujairah' },
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
