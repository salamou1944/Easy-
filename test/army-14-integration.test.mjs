import assert from 'node:assert/strict';
import test from 'node:test';
import { REQUIRED_ROLES, assertPinsUnchanged, validateConsumerRecords } from '../scripts/army-14-integration.mjs';

const runId = '987654321';
const runAttempt = '2';
const sha = 'a'.repeat(40);
const slug = role => String(role).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function completeFixture() {
  return REQUIRED_ROLES.map(role => {
    const branch = `army/${runId}/${slug(role)}`;
    return { branch, tip: sha, parentCommit: sha, manifest: {
      schema: 'army-14-worker-manifest/v1', status: 'VERIFIED', runId, runAttempt, role, branch,
      commit: sha, taskVerified: true, pipelineVerified: true, changedFiles: ['src/fix.mjs'], tests: [{passed:true}],
      independentEvidence: {fixtureOnly: true},
    } };
  });
}
const trustFixtureOnly = async records => ({ ok: records.length === 14, errors: [] });

test('consumer validates a complete fixture set and returns immutable branch pins', async () => {
  const result = await validateConsumerRecords(completeFixture(), { runId, runAttempt, validator: trustFixtureOnly });
  assert.equal(result.ok, true);
  assert.equal(result.pins.length, 14);
  assert.deepEqual(assertPinsUnchanged(result.pins, result.pins), {ok:true,errors:[]});
});

test('consumer rejects missing, duplicate, unexpected, and wrong-case roles', async () => {
  const missing = completeFixture().slice(1);
  assert.equal((await validateConsumerRecords(missing, {runId,runAttempt,validator:trustFixtureOnly})).ok, false);
  const duplicate = completeFixture(); duplicate[1] = structuredClone(duplicate[0]);
  assert.equal((await validateConsumerRecords(duplicate, {runId,runAttempt,validator:trustFixtureOnly})).ok, false);
  const badRole = completeFixture(); badRole[0].manifest.role = 'architect';
  assert.equal((await validateConsumerRecords(badRole, {runId,runAttempt,validator:trustFixtureOnly})).ok, false);
});

test('consumer rejects run, branch, commit, stale, and invalid-evidence records', async () => {
  for (const mutate of [
    record => { record.manifest.runId = 'old-run'; },
    record => { record.manifest.runAttempt = '1'; },
    record => { record.branch = 'army/old-run/architect'; },
    record => { record.parentCommit = 'b'.repeat(40); },
  ]) {
    const records = completeFixture(); mutate(records[0]);
    assert.equal((await validateConsumerRecords(records,{runId,runAttempt,validator:trustFixtureOnly})).ok,false);
  }
  const stale = completeFixture(); stale[0].manifest.createdAt = '2000-01-01';
  assert.equal((await validateConsumerRecords(stale,{runId,runAttempt,validator:async()=>({ok:false,errors:['timestamp_invalid']})})).ok,false);
  assert.equal((await validateConsumerRecords(completeFixture(),{runId,runAttempt,validator:async()=>({ok:false,errors:['independent_task_evidence_missing']})})).ok,false);
});

test('consumer refuses any change to a verified SHA before or during integration', () => {
  const pins = completeFixture().map(({branch,tip})=>({branch,tip}));
  const changed = pins.map(pin=>({...pin})); changed[0].tip='c'.repeat(40);
  assert.equal(assertPinsUnchanged(pins,changed).ok,false);
  assert.equal(assertPinsUnchanged(pins.slice(1),pins.slice(1)).ok,false);
  assert.equal(assertPinsUnchanged(pins,[...pins,{branch:'army/x/new-role',tip:sha}]).ok,false);
});
