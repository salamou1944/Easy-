import assert from 'node:assert/strict';
import test from 'node:test';
import { createSellerProductWorkflow } from '../src/seller-product-workflow.mjs';

function memoryStore() {
  const records = [];
  return {
    records,
    async save(record) { records.push(record); }
  };
}

const product = {
  product_name: 'Sac cuir',
  product_details: 'Cuir véritable. Fermeture métallique.',
  selling_points: ['Cuir véritable', 'Fermeture métallique']
};

test('seller workflow produces a review-ready fallback without making it publishable', async () => {
  const store = memoryStore();
  const workflow = createSellerProductWorkflow({ store });
  const result = await workflow(product);

  assert.equal(result.status, 'ready-for-seller-review');
  assert.equal(result.nextAction, 'seller-review');
  assert.equal(result.integrity.passed, true);
  assert.equal(result.creative.mode, 'deterministic-fallback');
  assert.equal(result.publishable, false);
  assert.match(result.requestId, /^[0-9a-f-]{36}$/);
  assert.equal(store.records.length, 1);
  assert.equal(store.records[0].status, 'validated');
  assert.equal(store.records[0].publishable, false);
});

test('seller workflow accepts provider output only when Product Integrity passes', async () => {
  const store = memoryStore();
  const workflow = createSellerProductWorkflow({
    store,
    creativeProvider: {
      async generate({ dna }) {
        return {
          provider: 'test-provider',
          text: `${dna.title}. Cuir véritable. Fermeture métallique. Une proposition commerciale validée.`
        };
      }
    }
  });

  const result = await workflow(product);
  assert.equal(result.creative.mode, 'provider');
  assert.equal(result.provider, 'test-provider');
  assert.equal(result.integrity.passed, true);
  assert.equal(result.publishable, true);
});

test('seller workflow rejects empty seller input before persistence', async () => {
  const store = memoryStore();
  const workflow = createSellerProductWorkflow({ store });

  await assert.rejects(() => workflow({}), /product_name|product_details/);
  assert.equal(store.records.length, 0);
});

test('seller workflow does not accept provider output that drops authoritative facts', async () => {
  const store = memoryStore();
  const workflow = createSellerProductWorkflow({
    store,
    creativeProvider: {
      async generate() {
        return { provider: 'bad-provider', text: 'Generic product advertisement.' };
      }
    }
  });

  await assert.rejects(
    () => workflow(product),
    /creative_provider_blocked:provider_integrity_failed/
  );
  assert.equal(store.records.length, 0);
});
