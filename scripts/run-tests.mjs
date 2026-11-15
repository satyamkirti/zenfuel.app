// Unit tests for the platform-independent screen-time logic (src/lib/usage).
// Compiles with the project's TypeScript and runs on Node's built-in test runner: no test
// framework dependency. Native Kotlin tests run separately with Gradle (see docs).
import { spawnSync } from 'node:child_process';
import { rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

rmSync('.test-build', { recursive: true, force: true });
const tsc = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.test.json'], { stdio: 'inherit' });
if (tsc.status !== 0) process.exit(tsc.status ?? 1);
const dir = join('.test-build', 'tests');
const files = readdirSync(dir).filter(f => f.endsWith('.test.js')).map(f => join(dir, f));
const run = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(run.status ?? 1);
