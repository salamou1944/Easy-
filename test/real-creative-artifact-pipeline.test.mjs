import test from 'node:test';
import assert from 'node:assert/strict';
import { createRealCreativeArtifactPipeline } from '../src/real-creative-artifact-pipeline.mjs';

test('real pipeline blocks explicitly without a provider instead of fabricating artifacts', async () => {
  const pipeline=createRealCreativeArtifactPipeline({});
  const result=await pipeline.run({ sourceImageUrl:'https://example.com/product.jpg' });
  assert.equal(result.status,'BLOCKED_EXTERNAL_DEPENDENCY');
  assert.equal(result.publishable,false);
});

test('real pipeline exposes preflight without consuming a provider operation', () => {
  const pipeline=createRealCreativeArtifactPipeline({});
  const result=pipeline.preflight({ sourceImageUrl:'https://example.com/product.jpg' });
  assert.equal(result.executionAllowed,false);
  assert.equal(result.claimBoundary,'preflight is not generation proof');
});
