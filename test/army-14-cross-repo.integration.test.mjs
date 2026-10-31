import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const validatorPath = process.env.ARMY14_VALIDATOR_PATH;
const skipReason = 'Set ARMY14_VALIDATOR_PATH to a checked-out immutable agent-skills commit to run cross-repository integration.';
const runId = 'local-integration-fixture';
const runAttempt = '2';
const commit = 'a'.repeat(40);
const roles = ['Architect','Builder','UI-UX','Backend-API','Database','Security','Integration','AI-Agent','Test-QA','Browser-E2E','Debug-Repair','Deployment-Ops','Product-MVP','Research-Capability'];
const slug = role => role.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

test('producer and consumer execute together and stay blocked without a trusted verifier', { skip: validatorPath ? false : skipReason }, async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'army-14-e2e-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const proofPath = path.join(dir, 'proof.json');
  const output = Buffer.from('synthetic fixture output; not task evidence\n');
  const outputPath = path.join(dir, 'output.txt');
  await writeFile(outputPath, output);
  const branch = `army/${runId}/architect`;
  const proof = { schema:'army-14-independent-task-evidence/v1',status:'PASS',runId,runAttempt,role:'Architect',branch,commit,
    checks:[{command:'fixture-only check',taskSpecific:true,passed:true,outputPath:'output.txt',outputSha256:createHash('sha256').update(output).digest('hex')}] };
  await writeFile(proofPath, JSON.stringify(proof));
  const resultPath = path.join(dir, 'result.json');
  await writeFile(resultPath, JSON.stringify({status:'VERIFIED',taskVerified:true,pipelineVerified:true,changedFiles:['src/fixture'],providerTelemetry:[]}));
  const testsPath = path.join(dir, 'tests.json');
  await writeFile(testsPath, JSON.stringify([{command:'fixture only',passed:true}]));
  const manifestPath = `.army-14/manifests/${runId}/architect.json`;
  const producer = spawnSync(process.execPath, [validatorPath,'create','--run-id',runId,'--run-attempt',runAttempt,'--role','Architect','--branch',branch,'--commit',commit,
    '--result',resultPath,'--tests',testsPath,'--proof',proofPath,'--output',path.join(dir,manifestPath)], {encoding:'utf8'});
  assert.notEqual(producer.status, 0);
  assert.match(producer.stderr, /independent_evidence_provider_unavailable/);
  await assert.rejects(readFile(path.join(dir,manifestPath)));

  const records = roles.map(role => {
    const roleBranch = `army/${runId}/${slug(role)}`;
    return {branch:roleBranch,tip:commit,parentCommit:commit,manifest:{schema:'army-14-worker-manifest/v1',status:'VERIFIED',runId,runAttempt,role,branch:roleBranch,commit,
      taskVerified:true,pipelineVerified:true,changedFiles:['src/fixture'],tests:[{command:'fixture only',passed:true}],createdAt:'2026-10-31T12:00:00Z',
      independentEvidence:{schema:'army-14-independent-task-evidence/v1',status:'PASS',runId,runAttempt,role,branch:roleBranch,commit,
        checks:[{command:'fixture only',taskSpecific:true,passed:true,outputPath:'output.txt',outputSha256:'b'.repeat(64)}]}}};
  });
  const recordsPath = path.join(dir,'records.json');
  const pinsPath = path.join(dir,'pins.json');
  await writeFile(recordsPath,JSON.stringify(records));
  const consumer = spawnSync(process.execPath,['scripts/army-14-integration.mjs','validate','--run-id',runId,'--run-attempt',runAttempt,
    '--records',recordsPath,'--validator',validatorPath,'--pins',pinsPath],{encoding:'utf8'});
  assert.notEqual(consumer.status,0);
  assert.match(consumer.stderr,/independent_evidence_provider_unavailable/);
  await assert.rejects(readFile(pinsPath));
});
