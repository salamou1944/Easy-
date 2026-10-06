import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCreativeCampaign } from '../src/creative-campaign-factory.mjs';
import { evaluateCreativeCampaignArtifacts, assertCreativeCampaignArtifactsPublishable } from '../src/creative-campaign-artifact-gate.mjs';

function campaign() {
  return buildCreativeCampaign({
    product_name: 'منتج',
    product_details: 'لون أسود، شعار EASY، تصميم مميز.',
    image_url: 'https://example.com/product.jpg',
    imageQuality: 'high_detail',
    videoScriptId: 'benefit_first',
    videoScriptText: 'هذا هو النص الذي اختاره العميل حرفيًا للفيديو.'
  });
}

test('exact customer video script text is persisted', () => {
  const c = campaign();
  assert.equal(c.customerControls.videoScript.selectedText, 'هذا هو النص الذي اختاره العميل حرفيًا للفيديو.');
  assert.equal(c.deliverables.videos[0].selectedScriptText, 'هذا هو النص الذي اختاره العميل حرفيًا للفيديو.');
});

test('artifact gate blocks without real provider artifacts and Meta verification', () => {
  const result = evaluateCreativeCampaignArtifacts({ campaign: campaign() });
  assert.equal(result.publishable, false);
  assert.ok(result.blockedReasons.includes('provider_artifacts_missing'));
  assert.ok(result.blockedReasons.includes('meta_readiness_not_verified'));
  assert.throws(() => assertCreativeCampaignArtifactsPublishable(result), /creative_campaign_artifacts_blocked/);
});

test('artifact gate passes only with all artifacts, integrity evidence, and Meta readiness', () => {
  const c = campaign();
  const artifacts = {
    enhancedSourceImage: { id: 'source_enhanced', url: 'https://example.com/source.jpg' },
    angles: c.deliverables.angles.map(x => ({ id: x.id, url: 'https://example.com/' + x.id + '.jpg' })),
    staticAds: c.deliverables.staticAds.map(x => ({ id: x.id, url: 'https://example.com/' + x.id + '.jpg' })),
    videos: c.deliverables.videos.map(x => ({ id: x.id, url: 'https://example.com/' + x.id + '.mp4' })),
    copy: { primaryText: ['a'], headlines: ['b'], ctas: ['c'] }
  };
  const integrity = [
    ...c.deliverables.angles.map(x => ({ artifactId: x.id, passed: true, publishable: true })),
    ...c.deliverables.staticAds.map(x => ({ artifactId: x.id, passed: true, publishable: true })),
    ...c.deliverables.videos.map(x => ({ artifactId: x.id, passed: true, publishable: true })),
    { artifactId: 'source_enhanced', passed: true, publishable: true }
  ];
  const result = evaluateCreativeCampaignArtifacts({
    campaign: c,
    artifacts,
    integrity,
    metaReadiness: { publishable: true }
  });
  assert.equal(result.publishable, true);
  assert.deepEqual(result.blockedReasons, []);
  assert.doesNotThrow(() => assertCreativeCampaignArtifactsPublishable(result));
});


test('real artifact pipeline contract rejects missing provider client before any fabricated output', async () => {
  const { createRealCreativeArtifactPipeline } = await import('../src/real-creative-artifact-pipeline.mjs');
  assert.throws(() => createRealCreativeArtifactPipeline({}), /fal_client_required/);
});
