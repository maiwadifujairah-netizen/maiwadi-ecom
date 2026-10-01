// Read-only production preflight: `npm run check` (or `npm run check:prod` after build).
// Validates env vars, pings MongoDB, Cloudinary and Razorpay, and reports seed data.
// Writes nothing and never prints secret values.
import './config/loadEnv.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import Razorpay from 'razorpay';

const results: { ok: boolean | null; label: string; detail?: string }[] = [];
const pass = (label: string, detail?: string) => results.push({ ok: true, label, detail });
const fail = (label: string, detail?: string) => results.push({ ok: false, label, detail });
const skip = (label: string, detail?: string) => results.push({ ok: null, label, detail });

// Strip anything that could carry credentials from driver/SDK error messages.
const scrub = (e: unknown) =>
  String((e as Error)?.message ?? e)
    .replace(/\/\/[^@\s/]+@/g, '//<credentials>@')
    .replace(/(key|secret|password|token)=[^&\s]+/gi, '$1=<hidden>')
    .slice(0, 200);

const e = process.env;
const isProd = e.NODE_ENV === 'production';

// ---------- environment ----------
for (const k of ['MONGODB_URI', 'JWT_SECRET']) (e[k] ? pass : fail)(`${k} is set`);
if (e.JWT_SECRET) (e.JWT_SECRET.length >= 32 && e.JWT_SECRET !== 'change-me' ? pass : fail)('JWT_SECRET is strong (>= 32 chars)', `${e.JWT_SECRET.length} chars`);
(e.ADMIN_EMAIL && (e.ADMIN_PASSWORD?.length ?? 0) >= 10 ? pass : fail)('ADMIN_EMAIL / ADMIN_PASSWORD usable by seed (password >= 10 chars)');
const origins = (e.CLIENT_URL || 'http://localhost:5173,http://localhost:5174').split(',').map((s) => s.trim());
if (isProd) (origins.every((o) => o.startsWith('https://')) ? pass : fail)('CLIENT_URL uses https origins in production', origins.join(', '));
else pass('CLIENT_URL (CORS origins)', origins.join(', '));
(['lax', 'none', undefined, ''].includes(e.COOKIE_SAMESITE) ? pass : fail)('COOKIE_SAMESITE valid', e.COOKIE_SAMESITE || 'lax (default)');
if (e.MONGODB_URI) {
  const hasPath = /mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(e.MONGODB_URI);
  pass('Database name', e.MONGODB_DB || (hasPath ? '(from URI path)' : 'maiwadi (default)'));
}

// ---------- MongoDB ----------
if (e.MONGODB_URI) {
  try {
    await mongoose.connect(e.MONGODB_URI, { dbName: e.MONGODB_DB || 'maiwadi', serverSelectionTimeoutMS: 15000 });
    await mongoose.connection.db!.admin().ping();
    pass('MongoDB connection', `database "${mongoose.connection.name}"`);
    const db = mongoose.connection.db!;
    const names = (await db.listCollections().toArray()).map((c) => c.name);
    const count = async (c: string) => (names.includes(c) ? db.collection(c).countDocuments() : 0);
    const counts = Object.fromEntries(await Promise.all(['products', 'categories', 'banners', 'orders', 'users', 'settings', 'inquiries'].map(async (c) => [c, await count(c)])));
    pass('Collections', Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', '));
    const product = await db.collection('products').findOne({ slug: 'mai-wadi-water-can' });
    if (product) pass('Seed product "MAI WADI Water Can"', `price ${product.price}, stock ${product.stock}, active ${product.isActive}, image ${product.images?.[0] ?? 'none'}`);
    else skip('Seed product', 'not found — run `npm run seed`');
    const admins = names.includes('users') ? await db.collection('users').countDocuments({ role: 'admin' }) : 0;
    (admins ? pass : skip)('Admin account exists', admins ? `${admins} admin(s)` : 'none — run `npm run seed`');
    // Read-only: does ADMIN_PASSWORD in .env match the stored hash for ADMIN_EMAIL?
    if (e.ADMIN_EMAIL && e.ADMIN_PASSWORD) {
      const admin = await db.collection('users').findOne({ email: e.ADMIN_EMAIL.toLowerCase() });
      if (!admin) skip(`Admin ${e.ADMIN_EMAIL}`, 'not found — `npm run seed` creates it');
      else if (admin.role !== 'admin') fail(`Admin ${e.ADMIN_EMAIL}`, 'exists but is not an admin');
      else (await bcrypt.compare(e.ADMIN_PASSWORD, admin.password) ? pass : fail)(`ADMIN_PASSWORD matches ${e.ADMIN_EMAIL}`, admin.status === 'active' ? '' : `account status: ${admin.status}`);
    }
  } catch (err) {
    fail('MongoDB connection', scrub(err) + ' (check Atlas → Network Access allows this IP, and the user/password)');
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

// ---------- Cloudinary ----------
if (e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET) {
  try {
    cloudinary.config({ cloud_name: e.CLOUDINARY_CLOUD_NAME, api_key: e.CLOUDINARY_API_KEY, api_secret: e.CLOUDINARY_API_SECRET, secure: true });
    const r = await cloudinary.api.ping();
    (r?.status === 'ok' ? pass : fail)('Cloudinary credentials', r?.status);
  } catch (err) {
    fail('Cloudinary credentials', scrub((err as { error?: { message?: string } })?.error?.message ?? err));
  }
} else (isProd ? fail : skip)('Cloudinary', 'not configured — uploads go to local disk (dev only)');

// ---------- Razorpay ----------
if (e.RAZORPAY_KEY_ID && e.RAZORPAY_KEY_SECRET) {
  const mode = e.RAZORPAY_KEY_ID.startsWith('rzp_live_') ? 'LIVE' : e.RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'TEST' : 'unknown';
  try {
    await new Razorpay({ key_id: e.RAZORPAY_KEY_ID, key_secret: e.RAZORPAY_KEY_SECRET }).orders.all({ count: 1 });
    pass('Razorpay credentials', `${mode} mode`);
    if (isProd && mode === 'TEST') fail('Razorpay mode in production', 'TEST keys — no real payments will be collected');
  } catch (err) {
    fail('Razorpay credentials', scrub((err as { error?: { description?: string } })?.error?.description ?? err));
  }
} else skip('Razorpay', 'not configured — checkout offers Cash on Delivery only');

// ---------- report ----------
for (const r of results) console.log(`${r.ok === true ? 'PASS' : r.ok === false ? 'FAIL' : 'SKIP'}  ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
const failed = results.filter((r) => r.ok === false).length;
console.log(`\n${failed ? `${failed} check(s) failed` : 'All required checks passed'}`);
process.exit(failed ? 1 : 0);
