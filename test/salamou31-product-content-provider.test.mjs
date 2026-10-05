import test from 'node:test';
import assert from 'node:assert/strict';
import { createSalamou31ProductContentProvider } from '../src/providers/salamou31-product-content.mjs';

test('maps EASY Product DNA to Salamou-31 product-content contract', async () => {
  let request;
  const provider = createSalamou31ProductContentProvider({
    baseUrl: 'https://api.example.test/',
    apiKey: 'runtime-only',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({
        ok: true,
        result: {
          title: 'Sac',
          short_description: 'Sac en cuir.',
          description: 'Fermeture métallique.',
          selling_points: ['Design pratique'],
          ad_copy: 'Découvrez ce sac.',
          cta: 'Acheter',
          audience: 'Mode',
          cautions: []
        }
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
  });
  const result = await provider.generate({
    dna: { title: 'Sac', authoritativeFacts: ['Cuir véritable', 'Fermeture métallique'] }
  });
  assert.equal(request.url, 'https://api.example.test/v1/product-content');
  assert.equal(request.options.headers['X-API-Key'], 'runtime-only');
  assert.deepEqual(JSON.parse(request.options.body), {
    product_name: 'Sac',
    product_details: 'Cuir véritable. Fermeture métallique',
    language: 'English'
  });
  assert.equal(result.provider, 'salamou31-ai-product-content-api');
  assert.match(result.text, /Sac en cuir/);
});

test('fails closed on provider errors', async () => {
  const provider = createSalamou31ProductContentProvider({
    baseUrl: 'https://api.example.test',
    apiKey: 'runtime-only',
    fetchImpl: async () => new Response(JSON.stringify({ error: 'quota' }), { status: 429 })
  });
  await assert.rejects(
    provider.generate({ dna: { title: 'Sac', authoritativeFacts: [] } }),
    /product_content_rate_limited/
  );
});
