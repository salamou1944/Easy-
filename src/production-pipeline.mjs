import { randomUUID } from 'node:crypto';
import { buildProductDna, checkProductIntegrity } from './easy-engine.mjs';
import { generateCreativeWithFallback } from './creative-orchestrator.mjs';
import { buildCreativeCampaign } from './creative-campaign-factory.mjs';

function validateProviderImageUrl(input, creativeProvider) {
  if (!creativeProvider || !input?.image_url) return;
  try {
    const url = new URL(input.image_url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('invalid_image_url_scheme');
  } catch (error) {
    throw new Error(`creative_provider_blocked:${error?.message === 'invalid_image_url_scheme' ? error.message : 'invalid_image_url'}`);
  }
}

export function createProductionPipeline({ creativeProvider = null, store }) {
  if (!store || typeof store.save !== 'function') throw new Error('durable_store_required');

  return async function run(input) {
    const requestId = randomUUID();
    validateProviderImageUrl(input, creativeProvider);
    const dna = buildProductDna(input);
    const campaign = buildCreativeCampaign({ ...input, dna });
    const generated = await generateCreativeWithFallback(input, { provider: creativeProvider });
    if (creativeProvider && generated.mode !== 'provider') {
      throw new Error(`creative_provider_blocked:${generated.fallbackReason || 'provider_error'}`);
    }
    const text = typeof generated?.text === 'string' ? generated.text.trim() : '';
    if (!text) throw new Error('creative_output_empty');

    const integrity = checkProductIntegrity(dna, text);
    if (!integrity.passed) throw new Error(`product_integrity_failed:${integrity.missingFacts.join('|')}`);

    const record = {
      version: 3,
      requestId,
      status: 'validated',
      mode: generated.mode,
      dna,
      creative: generated,
      campaign,
      integrity,
      provider: generated.provider || 'deterministic-safe-fixture',
      publishable: generated.mode === 'provider' && campaign.metaReadiness.publishable === true
    };
    await store.save(record);
    return record;
  };
}

export function assertProductionRecord(record) {
  if (!record?.requestId || record.status !== 'validated' || !record.integrity?.passed) throw new Error('invalid_production_record');
  if (!record.mode || !['provider', 'deterministic-fallback'].includes(record.mode)) throw new Error('invalid_production_mode');
  if (record.publishable !== (record.mode === 'provider' && record.campaign?.metaReadiness?.publishable === true)) throw new Error('invalid_publishability_contract');
  if (record.mode === 'deterministic-fallback') throw new Error('non_provider_creative_not_publishable');
  if (record.campaign?.metaReadiness?.publishable !== true) throw new Error('creative_campaign_not_meta_ready');
  return true;
}
