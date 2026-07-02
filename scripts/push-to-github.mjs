import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = process.argv[2];
const REMOTE_URL = 'https://github.com/satyamkirti/zenfuel.app.git';
const AUTHOR = { name: 'Satyam Kirti', email: 'satyam.kirti@gmail.com' };
const BRANCH = 'main';

if (!TOKEN) { console.error('Usage: node scripts/push-to-github.mjs <TOKEN>'); process.exit(1); }

async function run() {
  console.log('\n🚀  Zenfuel.app → GitHub\n');

  console.log('📁  Initialising repo...');
  await git.init({ fs, dir: ROOT, defaultBranch: BRANCH });

  console.log('📋  Staging all files...');
  await git.add({ fs, dir: ROOT, filepath: '.' });

  const status = await git.statusMatrix({ fs, dir: ROOT });
  const dirty = status.filter(([,h,w,s]) => !(h===1 && w===1 && s===1));
  console.log(`💾  ${dirty.length} file(s) to commit`);

  const sha = await git.commit({
    fs, dir: ROOT, author: AUTHOR,
    message: 'feat: Dopamine Detox Tracker — Next.js 14 + TypeScript + Tailwind\n\n- 12 pages: dashboard, analytics, habits, history, challenges, goals, reports, settings, upgrade\n- Multi-habit tracking with 8 default habits + custom\n- Detox, Focus, Discipline & Productivity Scores\n- Relapse prediction engine\n- Premium subscription system (Stripe/Razorpay/Google Play/Apple IAP ready)\n- PIN lock, dark/light mode, CSV/PDF export\n- 100% local — no backend required',
  });
  console.log(`✅  Committed: ${sha.slice(0, 7)}`);

  const onAuth = () => ({ username: TOKEN, password: '' });
  const onProgress = ({ phase, loaded, total }) => {
    process.stdout.write(`\r   ${phase} ${loaded}${total ? '/'+total : ''}   `);
  };

  const tryPush = async (force) => git.push({
    fs, http, dir: ROOT, url: REMOTE_URL, ref: BRANCH, onAuth, onProgress, force,
  });

  console.log(`\n⬆️   Pushing to github.com/satyamkirti/zenfuel.app ...`);
  try {
    await tryPush(false);
  } catch (e) {
    if (e.data?.response?.status === 403) {
      console.error('\n\n❌  403 — check the repo exists & token has "repo" scope.'); process.exit(1);
    }
    // non-fast-forward: remote already has commits, force-push
    console.log('\n⚠️   Non-fast-forward; force-pushing...');
    await tryPush(true);
  }

  console.log('\n\n🎉  Done!');
  console.log('🔗  https://github.com/satyamkirti/zenfuel.app\n');
}

run().catch(e => { console.error('\n❌', e.message || e); process.exit(1); });
