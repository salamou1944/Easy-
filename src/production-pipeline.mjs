import { randomUUID } from 'node:crypto';
import { buildProductDna, checkProductIntegrity } from './easy-engine.mjs';
import { generateCreativeWithFallback } from './creative-orchestrator.mjs';

export function createProductionPipeline({ creativeProvider = null, store }) {
  if (!store || typeof store.save !== 'function') throw new Error('durable_store_required');

  return async function run(input) {
    const requestId = randomUUID();
    const dna = buildProductDna(input);
    const generated = await generateCreativeWithFallback(input, { provider: creativeProvider });
    if (creativeProvider && generated.mode !== 'provider') {
      throw new Error(`creative_provider_blocked:${generated.fallbackReason || 'provider_error'}`);
    }
    const text = typeof generated?.text === 'string' ? generated.text.trim() : '';
    if (!text) throw new Error('creative_output_empty');

    const integrity = checkProductIntegrity(dna, text);
    if (!integrity.passed) throw new Error(`product_integrity_failed:${integrity.missingFacts.join('|')}`);

    const record = {
      version: 2,
      requestId,
      status: 'validated',
      mode: generated.mode,
      dna,
      creative: generated,
      integrity,
      provider: generated.provider || 'deterministic-safe-fixture'
    };
    await store.save(record);
    return record;
  };
}

export function assertProductionRecord(record) {
  if (!record?.requestId || record.status !== 'validated' || !record.integrity?.passed) throw new Error('invalid_production_record');
  if (!record.mode || !['provider', 'deterministic-fallback'].includes(record.mode)) throw new Error('invalid_production_mode');
  return true;
}
