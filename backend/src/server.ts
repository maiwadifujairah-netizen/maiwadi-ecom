import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/index.js';
import { env } from './config/env.js';
import { ENV_PATH } from './config/loadEnv.js';
import { connectDB, describeDbError } from './config/db.js';
import { createApp } from './app.js';

// Start listening only once the database is ready; never fall back to another database.
try {
  await connectDB();
} catch (err) {
  console.error(`\n✖ Could not connect to MongoDB (env file: ${ENV_PATH})\n${describeDbError(err)}\n`);
  process.exit(1);
}

// Safe admin diagnostic: email + yes/no facts only, never the password or its hash. Read-only.
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
console.log(`[ADMIN CONFIG] Email: ${ADMIN_EMAIL || '(ADMIN_EMAIL not set)'} | ADMIN_PASSWORD configured: ${ADMIN_PASSWORD ? 'yes' : 'no'}`);
if (ADMIN_EMAIL) {
  const admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() }).select('+password role status').lean();
  if (!admin) console.warn('[ADMIN CONFIG] No account with this email in the database — run `npm run seed` to create it');
  else if (admin.role !== 'admin') console.warn('[ADMIN CONFIG] Account exists but is not an admin');
  else if (ADMIN_PASSWORD && !(await bcrypt.compare(ADMIN_PASSWORD, admin.password)))
    console.warn('[ADMIN CONFIG] ADMIN_PASSWORD in backend/.env does NOT match the stored admin password — sign in with the original password, or run `npm run admin:reset-password -- --yes`');
  else console.log(`[ADMIN CONFIG] Admin account found (status: ${admin.status})${ADMIN_PASSWORD ? ', ADMIN_PASSWORD matches' : ''}`);
}

const server = createApp().listen(env.port, () => console.log(`API listening on :${env.port}`));
server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(err.code === 'EADDRINUSE' ? `✖ Port ${env.port} is already in use — stop the other process or set PORT in backend/.env` : `✖ Server error: ${err.message}`);
  process.exit(1);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const)
  process.on(sig, () => server.close(() => mongoose.disconnect().finally(() => process.exit(0))));
