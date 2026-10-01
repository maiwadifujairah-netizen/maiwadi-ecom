// Securely reset the admin password: `npm run admin:reset-password -- --yes`
// Sets the password of the admin whose email is ADMIN_EMAIL to ADMIN_PASSWORD (both from backend/.env).
// Only that one admin account is changed; the password is never printed.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, describeDbError } from './config/db.js';
import { User } from './models/index.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!process.argv.includes('--yes')) {
  console.log('This changes the admin password in the database.\nSet ADMIN_EMAIL and the new ADMIN_PASSWORD in backend/.env, then run:  npm run admin:reset-password -- --yes');
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 10) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters) must be set in backend/.env');
  process.exit(1);
}
try {
  await connectDB();
} catch (err) {
  console.error(describeDbError(err));
  process.exit(1);
}
const user = await User.findOneAndUpdate(
  { email: ADMIN_EMAIL.toLowerCase(), role: 'admin' },
  { password: await bcrypt.hash(ADMIN_PASSWORD, 12), status: 'active' },
  { returnDocument: 'after' },
);
console.log(user ? `✓ Password updated for ${user.email}` : `✖ No admin with email ${ADMIN_EMAIL} — run \`npm run seed\` to create it`);
await mongoose.disconnect();
process.exit(user ? 0 : 1);
