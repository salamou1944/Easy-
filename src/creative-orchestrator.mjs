import { buildProductDna, checkProductIntegrity, generateCreative } from './easy-engine.mjs';

/**
 * Provider-neutral creative boundary.
 * External providers are optional: a provider failure never turns into a fake
 * success. The deterministic engine is used only as an explicit safe fallback.
 */
export async function generateCreativeWithFallback(input, { provider = null } = {}) {
  const dna = buildProductDna(input);

  if (provider && typeof provider.generate === 'function') {
    try {
      const result = await provider.generate({ ...input, dna });
      const text = typeof result?.text === 'string' ? result.text.trim() : '';
      if (text) {
        const integrity = checkProductIntegrity(dna, text);
        if (integrity.passed) {
          return {
            version: 1,
            mode: 'provider',
            provider: result.provider || 'external',
            text,
            dna,
            integrity
          };
        }
      }
    } catch {
      // Deliberately fail over to the deterministic path below.
    }
  }

  const fallback = generateCreative({ ...input, dna });
  return {
    version: 1,
    mode: 'deterministic-fallback',
    provider: fallback.provider,
    text: [fallback.creative.headline, fallback.creative.primaryText, ...fallback.creative.sellingPoints].join(' '),
    creative: fallback.creative,
    dna: fallback.dna,
    integrity: fallback.integrity
  };
}
