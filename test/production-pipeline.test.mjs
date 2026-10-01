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
  assert.equal(result.publishable, false);
  assert.throws(() => assertProductionRecord(result), /non_provider_creative_not_publishable/);
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

test('production pipeline fails closed when configured provider throws', async () => {
  let saved = false;
  const pipeline = createProductionPipeline({
    creativeProvider: { async generate() { throw new Error('provider_down'); } },
    store: { async save() { saved = true; } }
  });
  await assert.rejects(
    () => pipeline({ product_name: 'Product B', product_details: 'Waterproof.' }),
    /creative_provider_blocked:provider_error/
  );
  assert.equal(saved, false);
});

test('production pipeline fails closed when provider output violates Product Integrity', async () => {
  let saved = false;
  const pipeline = createProductionPipeline({
    creativeProvider: { async generate() { return { text: 'Generic advertisement.' }; } },
    store: { async save() { saved = true; } }
  });
  await assert.rejects(
    () => pipeline({ product_name: 'Product C', product_details: 'Waterproof.' }),
    /creative_provider_blocked:provider_integrity_failed/
  );
  assert.equal(saved, false);
});


test('production pipeline rejects non-http image URLs before provider execution', async () => {
  let called = false;
  const pipeline = createProductionPipeline({
    creativeProvider: { async generate() { called = true; return { text: 'Product D. Waterproof.' }; } },
    store: { async save() {} }
  });
  await assert.rejects(
    () => pipeline({ product_name: 'Product D', product_details: 'Waterproof.', image_url: 'blob:demo-image' }),
    /creative_provider_blocked:invalid_image_url_scheme/
  );
  assert.equal(called, false);
});

test('configured provider failure never reaches durable persistence', async () => {
  const saved = [];
  const pipeline = createProductionPipeline({
    creativeProvider: { async generate() { throw new Error('provider_timeout'); } },
    store: { async save(record) { saved.push(record); } }
  });
  await assert.rejects(
    () => pipeline({ product_name: 'Product E', product_details: 'Durable facts.' }),
    /creative_provider_blocked:provider_error/
  );
  assert.deepEqual(saved, []);
});
