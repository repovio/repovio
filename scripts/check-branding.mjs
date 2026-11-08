import { execFileSync } from 'node:child_process';
import console from 'node:console';
import { existsSync, readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);
const formerName = /e[z]repo/i;
const failures = [];
for (const file of new Set(files)) {
  if (!existsSync(file)) continue;
  // Historical v1.0 setup keys must match the original tagged application.
  if (/^apps\/website\/content\/[^/]+\/docs\/v1\.0\/(?:language|localization|mcp)\.md$/.test(file)) continue;
  const buffer = readFileSync(file);
  if (buffer.includes(0)) continue;
  if (formerName.test(file) || formerName.test(buffer.toString('utf8'))) failures.push(file);
}
if (failures.length) throw new Error(`Obsolete branding: ${failures.join(', ')}`);
console.log('Repovio branding verified.');
