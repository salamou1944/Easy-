import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCreativeWithFallback } from '../src/creative-orchestrator.mjs';

test('creative orchestrator uses deterministic fallback when no provider is configured', async () => {
  const result = await generateCreativeWithFallback({
    product_name: 'حقيبة جلدية',
    product_details: 'جلد طبيعي. مقاس متوسط.'
  });

  assert.equal(result.mode, 'deterministic-fallback');
  assert.equal(result.fallbackReason, 'provider_not_configured');
  assert.equal(result.integrity.passed, true);
  assert.match(result.text, /حقيبة جلدية/);
  assert.match(result.text, /جلد طبيعي/);
});

test('creative orchestrator rejects provider output that loses authoritative facts and falls back safely', async () => {
  const result = await generateCreativeWithFallback(
    { product_name: 'حقيبة جلدية', product_details: 'جلد طبيعي. مقاس متوسط.' },
    { provider: { generate: async () => ({ provider: 'bad-provider', text: 'حقيبة رائعة بلا تفاصيل مؤكدة' }) } }
  );

  assert.equal(result.mode, 'deterministic-fallback');
  assert.equal(result.fallbackReason, 'provider_integrity_failed');
  assert.equal(result.integrity.passed, true);
  assert.match(result.text, /جلد طبيعي/);
  assert.match(result.text, /مقاس متوسط/);
});

test('creative orchestrator accepts a provider only when Product Integrity passes', async () => {
  const result = await generateCreativeWithFallback(
    { product_name: 'حقيبة جلدية', product_details: 'جلد طبيعي. مقاس متوسط.' },
    { provider: { generate: async () => ({ provider: 'fixture-provider', text: 'حقيبة جلدية — جلد طبيعي. مقاس متوسط.' }) } }
  );

  assert.equal(result.mode, 'provider');
  assert.equal(result.provider, 'fixture-provider');
  assert.equal(result.integrity.passed, true);
});
