import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocalMediaPlan, assertNoIntegrityMutationPolicy } from '../src/local-media-capabilities.mjs';

test('Collection local media plan is free-first and provider-independent',()=>{
  const p=getLocalMediaPlan({needsBackgroundRemoval:true,needsUpscaling:true});
  assert.equal(p.providerRequired,false);
  assert.deepEqual(p.steps.map(x=>x.capability),['background_removal','image_upscaling']);
});

test('local media capabilities inherit EASY product integrity policy',()=>{
  const p=assertNoIntegrityMutationPolicy('rembg');
  assert.ok(p.preserve.includes('logo'));
  assert.ok(p.preserve.includes('printedText'));
  assert.ok(p.mutationAllowed.includes('background'));
});
