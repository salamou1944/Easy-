import test from 'node:test';
import assert from 'node:assert/strict';
import { runCreativeImageGate } from '../src/creative-image-gate.mjs';

test('requires a real image artifact and positive verification', async () => {
  const result = await runCreativeImageGate(
    { dna: { title: 'Phone' } },
    {
      provider: { generate: async () => ({ provider: 'test-provider', artifact: { url: 'https://example.test/image.png' } }) },
      verifier: {
        verify: async () => ({
          color: true, logo: true, printedText: true, brandName: true,
          shape: true, majorComponents: true, distinctiveDetails: true
        })
      }
    }
  );
  assert.equal(result.status, 'validated');
  assert.equal(result.publishable, true);
});

test('blocks provider output when verification is incomplete', async () => {
  await assert.rejects(
    () => runCreativeImageGate(
      { dna: { title: 'Phone' } },
      {
        provider: { generate: async () => ({ artifact: { url: 'https://example.test/image.png' } }) },
        verifier: { verify: async () => ({ color: true }) }
      }
    ),
    /creative_image_blocked:visual_integrity_failed/
  );
});
