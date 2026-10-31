#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REQUIRED_ROLES = [
  'Architect', 'Builder', 'UI-UX', 'Backend-API', 'Database', 'Security',
  'Integration', 'AI-Agent', 'Test-QA', 'Browser-E2E', 'Debug-Repair',
  'Deployment-Ops', 'Product-MVP', 'Research-Capability',
];

export async function validateConsumerRecords(records, { runId, runAttempt, validator, roleSlug: sharedRoleSlug, roles = REQUIRED_ROLES } = {}) {
  const errors = [];
  if (!Array.isArray(records)) return { ok: false, errors: ['records_invalid'] };
  if (records.length !== roles.length) errors.push('role_record_count_mismatch');
  const slug = sharedRoleSlug ?? (role => String(role).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  for (const role of roles) {
    const matching = records.filter(record => record?.manifest?.role === role);
    if (matching.length !== 1) { errors.push(`${role}:expected_exactly_one_record`); continue; }
    const record = matching[0];
    const expectedBranch = `army/${runId}/${slug(role)}`;
    if (record.branch !== expectedBranch || record.manifest.branch !== expectedBranch) errors.push(`${role}:branch_mismatch`);
    if (record.manifest.runId !== String(runId)) errors.push(`${role}:run_id_mismatch`);
    if (record.manifest.runAttempt !== String(runAttempt)) errors.push(`${role}:run_attempt_mismatch`);
    if (!/^[a-f0-9]{40}$/i.test(String(record.tip)) || record.parentCommit !== record.manifest.commit || !/^[a-f0-9]{40}$/i.test(String(record.manifest.commit))) errors.push(`${role}:commit_binding_invalid`);
  }
  if (records.some(record => !roles.includes(record?.manifest?.role))) errors.push('unexpected_role_record');
  if (typeof validator !== 'function') errors.push('manifest_validator_unavailable');
  if (errors.length) return { ok: false, errors };
  const validation = await validator(records, { runId, runAttempt, roles });
  if (!validation?.ok) return { ok: false, errors: (validation?.errors ?? ['manifest_validation_failed']).map(error => `manifest:${error}`) };
  const pins = records.map(record => ({ branch: record.branch, tip: record.tip })).sort((a, b) => a.branch.localeCompare(b.branch));
  return { ok: true, errors: [], pins };
}

export function assertPinsUnchanged(pins, currentTips) {
  if (!Array.isArray(pins) || !Array.isArray(currentTips) || pins.length !== REQUIRED_ROLES.length || currentTips.length !== pins.length) {
    return { ok: false, errors: ['pinned_branch_set_incomplete'] };
  }
  const expected = new Map(pins.map(pin => [pin.branch, pin.tip]));
  const current = new Map(currentTips.map(pin => [pin.branch, pin.tip]));
  if (expected.size !== pins.length || current.size !== currentTips.length || expected.size !== current.size) return { ok: false, errors: ['pinned_branch_set_duplicate_or_changed'] };
  for (const [branch, tip] of expected) if (current.get(branch) !== tip) return { ok: false, errors: [`branch_tip_changed:${branch}`] };
  return { ok: true, errors: [] };
}

function arg(args, key) {
  const i = args.indexOf(`--${key}`);
  if (i < 0 || !args[i + 1]) throw new Error(`missing_${key}`);
  return args[i + 1];
}

async function main(args) {
  if (args[0] !== 'validate') throw new Error('unsupported_command');
  const runId = arg(args, 'run-id');
  const runAttempt = arg(args, 'run-attempt');
  const records = JSON.parse(await readFile(arg(args, 'records'), 'utf8'));
  const validatorPath = resolve(arg(args, 'validator'));
  const { validateRoleSet, roleSlug } = await import(pathToFileURL(validatorPath).href);
  const result = await validateConsumerRecords(records, { runId, runAttempt, validator: validateRoleSet, roleSlug });
  if (!result.ok) throw new Error(`integration_records_invalid:${result.errors.join(',')}`);
  await writeFile(arg(args, 'pins'), `${JSON.stringify(result.pins, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
