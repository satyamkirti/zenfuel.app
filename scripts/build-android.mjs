// Builds the web assets packaged inside the Android app and copies them into android/.
//
//   npm run build:android        static export (out/) + `cap sync android`
//   npm run build:android -- --no-sync   static export only
//
// The website build (`npm run build`, used by Vercel) is not affected.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run('npx', ['--no-install', 'next', 'build'], { ZENFUEL_TARGET: 'android' });

// Every app route must exist as a file, because the app has no server to render it.
const routes = ['index', 'analytics', 'habits', 'history', 'goals', 'challenges', 'reports', 'settings', 'screen-time', 'privacy', 'terms', 'contact', 'upgrade', 'refund', '404'];
const missing = routes.filter(r => !existsSync(`out/${r}.html`));
if (missing.length) {
  console.error(`Static export is missing: ${missing.join(', ')}. Found: ${readdirSync('out').join(', ')}`);
  process.exit(1);
}

if (!process.argv.includes('--no-sync')) run('npx', ['--no-install', 'cap', 'sync', 'android']);
