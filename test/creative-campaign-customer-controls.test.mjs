import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCreativeCampaign, IMAGE_QUALITY_OPTIONS } from '../src/creative-campaign-factory.mjs';

test('customer can choose source image quality treatment', () => {
  const campaign = buildCreativeCampaign({
    dna: { productName: 'Product A', color: 'Black' },
    imageQuality: 'high_detail'
  });
  assert.equal(campaign.customerControls.imageQuality.selected, 'high_detail');
  assert.equal(campaign.deliverables.enhancedSourceImage.selectedQuality, 'high_detail');
  assert.equal(campaign.customerControls.imageQuality.options.length, IMAGE_QUALITY_OPTIONS.length);
});

test('customer can choose the exact video script used for rendering', () => {
  const campaign = buildCreativeCampaign({
    dna: { productName: 'Product A', productBenefit: 'Fast delivery.' },
    videoScriptId: 'product_first'
  });
  assert.equal(campaign.customerControls.videoScript.selected, 'product_first');
  assert.equal(campaign.deliverables.videos[0].selectedScriptId, 'product_first');
  assert.equal(campaign.deliverables.videos[0].selectedScript.title, 'Product first');
});

test('invalid customer choices are rejected', () => {
  assert.throws(
    () => buildCreativeCampaign({ dna: { productName: 'Product A' }, imageQuality: 'ultra_fake' }),
    /creative_campaign_invalid_image_quality/
  );
  assert.throws(
    () => buildCreativeCampaign({ dna: { productName: 'Product A' }, videoScriptId: 'unknown' }),
    /creative_campaign_invalid_video_script/
  );
});
