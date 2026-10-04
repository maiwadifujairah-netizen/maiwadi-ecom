// Local dev runner: backend :5000, website :5173, admin :5174 (fixed — API URLs, CORS and cookies depend on them).
//   node scripts/dev.mjs           start whatever isn't already running
//   node scripts/dev.mjs --demo    same, but the backend uses an in-memory database
//   node scripts/dev.mjs --stop    stop this project's dev servers on those ports (nothing else)
// A port already served by this project's own dev server is reused, not started twice. A port held by any other
// program is reported with its PID and left alone. Apps run independently: one failing doesn't stop the others.
import { execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import concurrently from 'concurrently';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demo = process.argv.includes('--demo');
const APPS = [
  { name: 'backend', port: 5000, color: 'blue', command: demo ? 'npm --prefix backend run dev:memory' : 'npm run dev:backend', marker: demo ? 'dev-memory' : 'server.ts' },
  { name: 'frontend', port: 5173, color: 'cyan', command: 'npm run dev:frontend' },
  { name: 'admin', port: 5174, color: 'magenta', command: 'npm run dev:admin' },
];

const run = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
const info = (pid) => ({
  pid,
  ppid: Number(run('ps', ['-p', String(pid), '-o', 'ppid=']).trim()),
  command: run('ps', ['-p', String(pid), '-o', 'command=']).trim(),
  cwd: run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']).split('\n').find((l) => l.startsWith('n'))?.slice(1) ?? '',
});
const inProject = (p) => p.cwd === ROOT || p.cwd.startsWith(ROOT + path.sep);

// Anything accepting connections on localhost (IPv4 or IPv6; Vite binds ::1)?
const busy = (port) =>
  Promise.all(['127.0.0.1', '::1'].map((host) => new Promise((resolve) => {
    const s = net.connect({ port, host }, () => { s.destroy(); resolve(true); });
    s.on('error', () => resolve(false));
  }))).then((r) => r.some(Boolean));

// ponytail: lsof/ps are macOS/Linux; on Windows ownership is unknown, so a busy port is reported without a PID
const listeners = (port) => run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']).split('\n').filter(Boolean).map((pid) => info(Number(pid)));

/** The listener plus its launcher chain (npm → tsx watch → node) inside this project, stopping at the shell. */
function chain(p) {
  const out = [];
  for (let cur = p; cur.pid > 1 && inProject(cur) && !/(^|\/)-?(zsh|bash|sh|fish)( |$)/.test(cur.command); cur = info(cur.ppid)) out.push(cur);
  return out;
}

if (process.argv.includes('--stop')) {
  let stopped = 0;
  for (const app of APPS)
    for (const l of listeners(app.port)) {
      if (!inProject(l)) { console.log(`:${app.port} is used by another program (PID ${l.pid}: ${l.command}) — left running`); continue; }
      for (const p of chain(l)) { try { process.kill(p.pid, 'SIGTERM'); } catch { /* already gone */ } }
      console.log(`stopped ${app.name} on :${app.port} (PID ${l.pid})`);
      stopped++;
    }
  if (!stopped) console.log('No MAI WADI dev servers were running.');
  process.exit(0);
}

const start = [];
let blocked = false;
for (const app of APPS) {
  if (!(await busy(app.port))) { start.push(app); continue; }
  const owner = listeners(app.port)[0];
  if (owner && inProject(owner) && (!app.marker || owner.command.includes(app.marker) || chain(owner).some((p) => p.command.includes(app.marker)))) {
    console.log(`✓ ${app.name} is already running on :${app.port} (PID ${owner.pid}) — reusing it`);
  } else if (owner && inProject(owner)) {
    console.error(`✖ ${app.name}: :${app.port} is running this project's backend in the other mode (${demo ? 'real database' : 'in-memory'}). Run \`npm run dev:stop\`, then start again.`);
    blocked = true;
  } else {
    const who = owner ? `PID ${owner.pid}: ${owner.command}` : 'another program';
    const hint = /ControlCenter|AirPlay/.test(owner?.command ?? '') ? ' (macOS AirPlay Receiver — turn it off in System Settings → General → AirDrop & Handoff)' : '';
    console.error(`✖ ${app.name} not started: port ${app.port} is in use by ${who}${hint}. Stop that program; the port can't change without breaking API URLs/CORS.`);
    blocked = true;
  }
}

if (!start.length) {
  console.log(blocked ? 'Nothing started.' : 'All MAI WADI dev servers are already running: http://localhost:5173 (website) · http://localhost:5174 (admin) · API :5000');
  process.exit(blocked ? 1 : 0);
}
const { result } = concurrently(
  start.map(({ name, command, color }) => ({ name, command, prefixColor: color })),
  { cwd: ROOT, killOthersOn: [] }, // independent: a crash in one app leaves the others running
);
result.catch(() => { process.exitCode = 1; });
