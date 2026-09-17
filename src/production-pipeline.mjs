import { randomUUID } from 'node:crypto';
import { buildProductDna, checkProductIntegrity } from './easy-engine.mjs';

export function createProductionPipeline({ creativeProvider, store }) {
  if (!creativeProvider || typeof creativeProvider.generate !== 'function') throw new Error('creative_provider_required');
  if (!store || typeof store.save !== 'function') throw new Error('durable_store_required');

  return async function run(input) {
    const requestId = randomUUID();
    const dna = buildProductDna(input);
    const generated = await creativeProvider.generate({ ...input, dna, requestId });
    if (!generated || typeof generated.text !== 'string' || !generated.text.trim()) throw new Error('provider_empty_output');
    const integrity = checkProductIntegrity(dna, generated.text);
    if (!integrity.passed) throw new Error(`product_integrity_failed:${integrity.missingFacts.join('|')}`);
    const record = {
      version: 1,
      requestId,
      status: 'validated',
      dna,
      creative: generated,
      integrity,
      provider: generated.provider || 'external'
    };
    await store.save(record);
    return record;
  };
}

export function assertProductionRecord(record) {
  if (!record?.requestId || record.status !== 'validated' || !record.integrity?.passed) throw new Error('invalid_production_record');
  return true;
}
