import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const maxCycles = Math.max(1, Number(process.env.EASY_AUTONOMOUS_MAX_CYCLES || 4));
const reportPath = resolve(process.env.EASY_AUTONOMOUS_REPORT || '.easy/autonomous-worker.json');

const checks = [
  { id: 'easy.inspect-blocker', command: 'npm', args: ['test'] },
  { id: 'easy.syntax', command: 'npm', args: ['run', 'check'] }
];

function run(command, args) {
  return new Promise(resolveResult => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);
    child.on('error', e => resolveResult({ code: 1, stdout, stderr: e.message }));
    child.on('close', code => resolveResult({ code, stdout, stderr }));
  });
}

const history = [];
for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
  const cycleResults = [];
  for (const check of checks) {
    const result = await run(check.command, check.args);
    cycleResults.push({ id: check.id, exitCode: result.code, stdout: result.stdout.slice(-4000), stderr: result.stderr.slice(-2000) });
    if (result.code !== 0) break;
  }
  history.push({ cycle, results: cycleResults, verified: cycleResults.every(x => x.exitCode === 0) });
  if (!cycleResults.every(x => x.exitCode === 0)) break;
}

const verified = history.length > 0 && history.every(x => x.verified);
const report = {
  version: 2,
  status: verified ? 'VERIFIED' : 'BLOCKED',
  maxCycles,
  history,
  generatedAt: new Date().toISOString(),
  rules: ['evidence-driven', 'fail-closed', 'no-fabricated-completion', 'repeat-verification']
};
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
if (!verified) process.exitCode = 1;
