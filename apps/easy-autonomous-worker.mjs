import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const maxCycles = Math.max(1, Number(process.env.EASY_AUTONOMOUS_MAX_CYCLES || 4));
const reportPath = resolve(process.env.EASY_AUTONOMOUS_REPORT || '.easy/autonomous-worker.json');
const cooldownMs = Math.max(0, Number(process.env.EASY_AUTONOMOUS_COOLDOWN_MS || 300000));

const tasks = [
  { id: 'easy.inspect-blocker', goal: 'Inspect the EASY repository and identify the highest-value unfinished practical blocker; implement the smallest safe verified fix.' },
  { id: 'easy.creative-engine', goal: 'Complete the real EASY Creative Engine path: Product DNA, Product Integrity, creative orchestration/provider boundary, and validated output while preserving product facts, colors, text, logos, and identity.' },
  { id: 'easy.seller-product', goal: 'Complete the seller/product workflow needed to take product input to a usable validated result.' },
  { id: 'easy.commerce-boundary', goal: 'Complete provider-neutral commerce integration with safe fixture/live boundaries; never require live credentials for fixture tests.' },
  { id: 'easy.e2e', goal: 'Repair or add end-to-end verification for the primary seller journey and critical failure paths.' },
  { id: 'easy.next-capability', goal: 'Identify and implement the next concrete missing capability required for a usable and sellable EASY release, using the smallest safe verified step.' }
];

function run(args) {
  return new Promise(resolveResult => {
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);
    child.on('error', e => resolveResult({ code: 1, stdout, stderr: e.message }));
    child.on('close', code => resolveResult({ code, stdout, stderr }));
  });
}

function parse(stdout) {
  for (const line of stdout.trim().split('\n').reverse()) {
    try { return JSON.parse(line); } catch {}
  }
  return null;
}

const history = [];
for (let cycle = 0; cycle < maxCycles; cycle += 1) {
  const task = tasks[cycle % tasks.length];
  const result = await run(['../apps/easy-developer-platform/autonomous-coder.mjs', task.goal]);
  const parsed = parse(result.stdout);
  history.push({ cycle: cycle + 1, task: task.id, exitCode: result.code, result: parsed, stderr: result.stderr.slice(-2000) });
  if (parsed?.status === 'VERIFIED' || parsed?.status === 'VERIFIED_NOOP') continue;
  if (parsed?.status === 'BLOCKED' || parsed?.status === 'FAILED') continue;
  if (result.code !== 0) continue;
}

const report = { version: 1, status: 'COMPLETED_CYCLE', maxCycles, cooldownMs, history, generatedAt: new Date().toISOString(), rules: ['evidence-driven', 'fail-closed', 'no-fabricated-completion', 'provider-fallback', 'critical-path-first'] };
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
