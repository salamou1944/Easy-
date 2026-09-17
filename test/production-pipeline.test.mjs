import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductionPipeline, assertProductionRecord } from '../src/production-pipeline.mjs';

test('production pipeline supports deterministic fallback without a provider', async () => {
  let saved = null;
  const pipeline = createProductionPipeline({ store: { async save(record) { saved = record; } } });
  const result = await pipeline({ product_name: 'Product A', product_details: 'Fast delivery.' });
  assert.equal(result.status, 'validated');
  assert.equal(result.mode, 'deterministic-fallback');
  assert.equal(result.integrity.passed, true);
  assert.equal(saved.requestId, result.requestId);
  assertProductionRecord(result);
});

test('production pipeline requires durable store', () => {
  assert.throws(() => createProductionPipeline({}), /durable_store_required/);
});

test('production pipeline accepts provider output only after integrity validation', async () => {
  let saved = null;
  const pipeline = createProductionPipeline({
    creativeProvider: { async generate() { return { text: 'Product A. Fast delivery.', provider: 'test-provider' }; } },
    store: { async save(record) { saved = record; } }
  });
  const result = await pipeline({ product_name: 'Product A', product_details: 'Fast delivery.' });
  assert.equal(result.status, 'validated');
  assert.equal(result.mode, 'provider');
  assert.equal(result.provider, 'test-provider');
  assert.equal(result.integrity.passed, true);
  assert.equal(saved.requestId, result.requestId);
  assertProductionRecord(result);
});

test('production pipeline falls back when provider throws', async () => {
  const pipeline = createProductionPipeline({
    creativeProvider: { async generate() { throw new Error('provider_down'); } },
    store: { async save() {} }
  });
  const result = await pipeline({ product_name: 'Product B', product_details: 'Waterproof.' });
  assert.equal(result.mode, 'deterministic-fallback');
  assert.equal(result.integrity.passed, true);
});
