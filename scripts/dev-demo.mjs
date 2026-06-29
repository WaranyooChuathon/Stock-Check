// Local "just run it" launcher: forces in-memory demo mode, no database needed.
//
// Why this exists: `npm run dev` runs `next dev`, which loads `.env`. If `.env`
// has a DATABASE_URL that isn't reachable locally, the app runs in DB mode and
// DB-backed pages 500 (home dashboard, login "เข้าสู่ Live Demo", /units, ...).
// Setting DEMO_MOCK=1 makes isDemoMode() true regardless of `.env` (see
// src/lib/demo.ts), so the app serves deterministic synthetic data with zero
// config. `npm run dev` is left untouched for real-DB work.
import { spawn } from 'node:child_process';

process.env.DEMO_MOCK = '1';

// Forward any extra args, e.g. `npm run dev:demo -- -p 3001`.
const args = ['dev', ...process.argv.slice(2)];

// `shell: true` lets the OS resolve the `next` bin from node_modules/.bin
// (which npm puts on PATH for scripts) on both Windows and POSIX.
const child = spawn('next', args, { stdio: 'inherit', shell: true });

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
