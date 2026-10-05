import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCreativeImagePublishable, verifyCreativeImageIntegrity } from '../src/creative-image-integrity.mjs';

test('blocks image without visual verification', () => {
  const result = verifyCreativeImageIntegrity({
    dna: { title: 'Phone' },
    artifact: { url: 'https://example.test/image.png' }
  });
  assert.equal(result.passed, false);
  assert.equal(result.publishable, false);
  assert.equal(result.reason, 'missing_visual_verification');
  assert.throws(() => assertCreativeImagePublishable(result), /creative_image_blocked/);
});

test('blocks incomplete preservation evidence', () => {
  const result = verifyCreativeImageIntegrity({
    dna: { title: 'Phone' },
    artifact: { url: 'https://example.test/image.png' },
    verification: { color: true, logo: true }
  });
  assert.equal(result.passed, false);
  assert.ok(result.missing.includes('printedText'));
});

test('accepts only explicit positive evidence for every preservation rule', () => {
  const verification = {
    color: true, logo: true, printedText: true, brandName: true,
    shape: true, majorComponents: true, distinctiveDetails: true
  };
  const result = verifyCreativeImageIntegrity({
    dna: { title: 'Phone' },
    artifact: { url: 'https://example.test/image.png' },
    verification
  });
  assert.equal(result.passed, true);
  assert.equal(result.publishable, true);
  assert.equal(assertCreativeImagePublishable(result), true);
});
