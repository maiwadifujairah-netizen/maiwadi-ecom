import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: env.mongoDb, serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`); // never log the URI
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected — the driver will retry automatically'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
}

/** Turns a connection error into a short, credential-free diagnosis with the likely fix. */
export function describeDbError(err: unknown): string {
  const e = err as { name?: string; message?: string; code?: string | number; reason?: { servers?: Map<string, { error?: { cause?: { code?: string }; code?: string | number; message?: string } }> } };
  const codes = new Set<string>();
  if (e?.code) codes.add(String(e.code));
  for (const d of e?.reason?.servers?.values() ?? []) {
    if (d.error?.cause?.code) codes.add(d.error.cause.code);
    if (d.error?.code) codes.add(String(d.error.code));
  }
  const text = `${e?.message ?? ''} ${[...codes].join(' ')}`;
  const safe = (e?.message ?? String(err)).replace(/\/\/[^@\s/]+@/g, '//<credentials>@').slice(0, 200);

  let hint = 'Check MONGODB_URI in backend/.env and that the Atlas cluster is running.';
  if (/ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR|tlsv1 alert internal error|whitelist|IP that isn't/i.test(text))
    hint = "Atlas rejected the TLS handshake. This almost always means this machine's public IP is not on the cluster's access list: Atlas → Security → Network Access → Add IP Address (then wait ~1 minute). Also confirm the cluster is not paused.";
  else if (/Authentication failed|bad auth|AuthenticationFailed|\b18\b/i.test(text))
    hint = 'Atlas refused the username/password in MONGODB_URI. Check the database user in Atlas → Security → Database Access (special characters in the password must be URL-encoded).';
  else if (/ENOTFOUND|querySrv|EREFUSED|ESERVFAIL/i.test(text))
    hint = 'The cluster hostname could not be resolved. Check the host part of MONGODB_URI and your DNS / internet connection.';
  else if (/ETIMEDOUT|ECONNREFUSED|timed out|Server selection timed out/i.test(text))
    hint = 'The cluster could not be reached. A firewall or network may be blocking outbound port 27017.';

  return `${e?.name ?? 'Error'}${codes.size ? ` [${[...codes].join(', ')}]` : ''}: ${safe}\n→ ${hint}`;
}
