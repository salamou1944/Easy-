/**
 * EASY Creative Campaign Factory
 *
 * Canonical contract:
 * one product image -> a complete Meta-ready creative campaign plan.
 *
 * This module plans the required outputs and gates publishability. It does not
 * fabricate generated media: provider-backed image/video generation remains a
 * separate capability and must produce real artifacts before the campaign can
 * become publishable.
 */

export const CREATIVE_CAMPAIGN_VERSION = 1;

export const META_CREATIVE_FORMATS = Object.freeze([
  { id: 'feed_portrait', width: 1080, height: 1350, aspectRatio: '4:5', placement: 'feed' },
  { id: 'square', width: 1080, height: 1080, aspectRatio: '1:1', placement: 'feed' },
  { id: 'story_reels', width: 1080, height: 1920, aspectRatio: '9:16', placement: 'stories_reels' }
]);

export const CREATIVE_ANGLE_TYPES = Object.freeze([
  'hero_product',
  'close_up',
  'lifestyle',
  'in_use',
  'detail',
  'alternative_composition'
]);

export const VIDEO_SPEC = Object.freeze({
  minDurationSeconds: 6,
  maxDurationSeconds: 60,
  preferredAspectRatio: '9:16',
  requiredStages: ['hook', 'product_reveal', 'product_benefit', 'cta']
});

function clean(value, max = 240) {
  return String(value ?? '').trim().slice(0, max);
}

function hasProductIdentity(dna) {
  return Boolean(dna && typeof dna === 'object' && (
    clean(dna.productName || dna.product_name) ||
    clean(dna.brand) ||
    clean(dna.color)
  ));
}

/**
 * Build the canonical deliverable manifest from one product input.
 * No generated asset is marked publishable by this function.
 */
export function buildCreativeCampaign(input = {}) {
  const dna = input.dna || {};
  if (!hasProductIdentity(dna)) throw new Error('creative_campaign_product_dna_required');

  const angles = CREATIVE_ANGLE_TYPES.map((type, index) => ({
    id: `angle_${index + 1}`,
    type,
    source: 'single_product_image',
    requiresProviderArtifact: true
  }));

  const staticAds = META_CREATIVE_FORMATS.map((format) => ({
    id: `static_${format.id}`,
    kind: 'image',
    format,
    requiresProviderArtifact: true,
    integrityRequired: true
  }));

  const videos = [{
    id: 'video_reel_01',
    kind: 'video',
    spec: VIDEO_SPEC,
    requiresProviderArtifact: true,
    integrityRequired: true
  }];

  const copy = {
    primaryTextVariants: 3,
    headlineVariants: 3,
    ctaVariants: 2,
    requiresProductFactValidation: true
  };

  return {
    version: CREATIVE_CAMPAIGN_VERSION,
    input: {
      source: 'single_product_image',
      imageProvided: Boolean(input.image_url || input.imageUrl),
      dna
    },
    deliverables: {
      angles,
      staticAds,
      videos,
      copy
    },
    metaReadiness: {
      requiredFormats: META_CREATIVE_FORMATS.map(({ id }) => id),
      policyReviewRequired: true,
      assetIntegrityRequired: true,
      publishable: false,
      blockedReason: 'provider_artifacts_and_validation_required'
    }
  };
}

/**
 * Publishability is intentionally fail-closed.
 * Every required asset must be real, validated, and tied to the same Product DNA.
 */
export function assertCreativeCampaignPublishable(campaign = {}) {
  if (!campaign?.deliverables?.angles?.length) throw new Error('creative_campaign_angles_missing');
  if (!campaign?.deliverables?.staticAds?.length) throw new Error('creative_campaign_static_ads_missing');
  if (!campaign?.deliverables?.videos?.length) throw new Error('creative_campaign_video_missing');
  if (campaign?.metaReadiness?.publishable !== true) {
    throw new Error(`creative_campaign_blocked:${campaign?.metaReadiness?.blockedReason || 'not_publishable'}`);
  }
  return true;
}
