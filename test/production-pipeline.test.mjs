import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductionPipeline } from '../src/production-pipeline.mjs';

test('production pipeline fails closed without provider', () => {
  assert.throws(() => createProductionPipeline({ store: { save() {} } }), /creative_provider_required/);
});

test('production pipeline requires durable store', () => {
  assert.throws(() => createProductionPipeline({ creativeProvider: { generate() {} } }), /durable_store_required/);
});

test('production pipeline validates provider output before persistence', async () => {
  let saved = null;
  const pipeline = createProductionPipeline({
    creativeProvider: { async generate() { return { text: 'Product A. Fast delivery.', provider: 'test-provider' }; } },
    store: { async save(record) { saved = record; } }
  });
  const result = await pipeline({ product_name: 'Product A', product_details: 'Fast delivery.' });
  assert.equal(result.status, 'validated');
  assert.equal(result.integrity.passed, true);
  assert.equal(saved.requestId, result.requestId);
});
