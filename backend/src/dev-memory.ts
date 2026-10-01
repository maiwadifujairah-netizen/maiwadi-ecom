// Local demo without Atlas: `npm run dev:memory` — in-memory MongoDB, seeded, data lost on exit.
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
process.env.JWT_SECRET ??= 'local-dev-secret';
process.env.ADMIN_EMAIL ??= 'admin@maiwadi.local';
process.env.ADMIN_PASSWORD ||= 'admin12345';
const { connectDB } = await import('./config/db.js');
const { seed } = await import('./seed.js');
const { createApp } = await import('./app.js');
await connectDB(mongo.getUri());
await seed();
const port = Number(process.env.PORT) || 5000;
createApp().listen(port, () => console.log(`In-memory API on :${port} — admin: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`));
