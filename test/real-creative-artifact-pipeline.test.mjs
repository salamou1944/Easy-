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


test('real pipeline executes injected local media capabilities before provider work', async () => {
  const calls = [];
  const pipeline=createRealCreativeArtifactPipeline({
    falClient: {},
    localMediaExecutor: {
      async run(input) {
        calls.push(input);
        return { status:'LOCAL_CAPABILITY_EXECUTED', publishable:true, outputUrl:'file:///tmp/upscaled.png', steps:[{ capability:'upscayl', execution:'executed' }], claimBoundary:'local capability execution returned an artifact; integrity verification remains required' };
      }
    }
  });
  const result=await pipeline.run({
    sourceImageUrl:'https://example.com/product.jpg',
    dna:{},
    campaign:{imageQuality:'balanced',videoScriptText:'Use this product today.',deliverables:{},customerControls:{}},
    localMedia:{upscaling:true}
  });
  assert.equal(calls.length,1);
  assert.equal(calls[0].needsUpscaling,true);
  assert.equal(calls[0].sourceImageUrl,'https://example.com/product.jpg');
  assert.notEqual(result.status,'BLOCKED_LOCAL_MEDIA');
});

test('requested local media blocks closed when no executor is configured', async () => {
  const pipeline=createRealCreativeArtifactPipeline({falClient:{}});
  const result=await pipeline.run({
    sourceImageUrl:'https://example.com/product.jpg',
    dna:{},
    campaign:{imageQuality:'balanced',videoScriptText:'Use this product today.',deliverables:{},customerControls:{}},
    localMedia:{backgroundRemoval:true}
  });
  assert.equal(result.status,'BLOCKED_LOCAL_MEDIA');
  assert.equal(result.publishable,false);
});
