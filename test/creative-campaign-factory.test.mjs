import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCreativeCampaign,
  assertCreativeCampaignPublishable,
  CREATIVE_ANGLE_TYPES,
  META_CREATIVE_FORMATS
} from '../src/creative-campaign-factory.mjs';

test('one product image expands into the canonical Meta creative campaign manifest', () => {
  const campaign = buildCreativeCampaign({
    image_url: 'https://example.com/product.jpg',
    dna: { productName: 'Product A', brand: 'Brand A', color: 'Black' }
  });

  assert.equal(campaign.input.source, 'single_product_image');
  assert.equal(campaign.deliverables.angles.length, CREATIVE_ANGLE_TYPES.length);
  assert.equal(campaign.deliverables.staticAds.length, META_CREATIVE_FORMATS.length);
  assert.equal(campaign.deliverables.videos.length, 1);
  assert.equal(campaign.deliverables.copy.primaryTextVariants, 3);
  assert.equal(campaign.metaReadiness.publishable, false);
});

test('campaign cannot be published before real provider artifacts and validation', () => {
  const campaign = buildCreativeCampaign({
    dna: { productName: 'Product A', color: 'Black' }
  });

  assert.throws(
    () => assertCreativeCampaignPublishable(campaign),
    /creative_campaign_blocked:provider_artifacts_and_validation_required/
  );
});

test('Product DNA is mandatory for campaign construction', () => {
  assert.throws(
    () => buildCreativeCampaign({ image_url: 'https://example.com/product.jpg' }),
    /creative_campaign_product_dna_required/
  );
});
