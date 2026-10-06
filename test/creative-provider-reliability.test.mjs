import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyProviderError,
  createProviderCircuitBreaker,
  createIdempotencyKey,
  withProviderReliability,
  providerPreflight
} from '../src/creative-provider-reliability.mjs';

test('collection reliability skill: preflight blocks unconfigured provider', () => {
  const result = providerPreflight({ providerConfigured:false, sourceImageUrl:'https://example.com/x.jpg', model:'fal-ai/qwen-image-edit-2511' });
  assert.equal(result.ready, false);
  assert.equal(result.executionAllowed, false);
});

test('collection reliability skill: provider errors are normalized', () => {
  assert.deepEqual(classifyProviderError({ status: 429, message:'rate limited' }).category, 'transient_provider');
  assert.deepEqual(classifyProviderError({ status: 401, message:'unauthorized' }).category, 'authentication');
  assert.deepEqual(classifyProviderError({ status: 400, message:'invalid schema' }).category, 'validation');
});

test('collection reliability skill: idempotency key is stable', () => {
  assert.equal(createIdempotencyKey({ a:1, b:2 }), createIdempotencyKey({ a:1, b:2 }));
});

test('collection reliability skill: transient failures retry then succeed', async () => {
  let calls=0;
  const circuit=createProviderCircuitBreaker({ failureThreshold:3});
  const result=await withProviderReliability(async()=>{ calls+=1; if(calls<2) throw Object.assign(new Error('busy'),{status:503}); return 'ok'; }, { circuit, maxRetries:2, sleep:async()=>{} });
  assert.equal(result.ok,true);
  assert.equal(calls,2);
});

test('collection reliability skill: circuit opens after repeated failures', async () => {
  const circuit=createProviderCircuitBreaker({ failureThreshold:1});
  const result=await withProviderReliability(async()=>{ throw Object.assign(new Error('down'),{status:503}); }, { circuit, maxRetries:0, sleep:async()=>{} });
  assert.equal(result.ok,false);
  assert.equal(circuit.state(),'open');
  assert.throws(()=>circuit.beforeCall(), /creative_provider_circuit_open/);
});
