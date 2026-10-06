/**
 * EASY Creative Campaign Factory
 * Canonical contract: one product image -> enhanced source -> selectable video script -> complete Meta-oriented creative campaign.
 */
export const CREATIVE_CAMPAIGN_VERSION = 2;

export const META_CREATIVE_FORMATS = Object.freeze([
  { id: 'feed_portrait', width: 1080, height: 1350, aspectRatio: '4:5', placement: 'feed' },
  { id: 'square', width: 1080, height: 1080, aspectRatio: '1:1', placement: 'feed' },
  { id: 'story_reels', width: 1080, height: 1920, aspectRatio: '9:16', placement: 'stories_reels' }
]);

export const CREATIVE_ANGLE_TYPES = Object.freeze([
  'hero_product', 'close_up', 'lifestyle', 'in_use', 'detail', 'alternative_composition'
]);

export const IMAGE_QUALITY_OPTIONS = Object.freeze([
  { id: 'balanced', label: 'Balanced', enhancement: 'denoise_sharpen_upscale' },
  { id: 'high_detail', label: 'High detail', enhancement: 'upscale_texture_preservation' },
  { id: 'clean_commercial', label: 'Clean commercial', enhancement: 'denoise_lighting_detail' }
]);

export const VIDEO_SPEC = Object.freeze({
  minDurationSeconds: 6,
  maxDurationSeconds: 60,
  preferredAspectRatio: '9:16',
  requiredStages: ['hook', 'product_reveal', 'product_benefit', 'cta']
});

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function hasProductIdentity(dna) {
  return Boolean(dna && typeof dna === 'object' && (
    clean(dna.productName || dna.product_name || dna.title) ||
    clean(dna.brand) ||
    clean(dna.color) ||
    (Array.isArray(dna.authoritativeFacts) && dna.authoritativeFacts.length > 0)
  ));
}

function buildVideoScriptOptions(dna, customScriptText = '') {
  const product = clean(dna.productName || dna.product_name || dna.title || 'هذا المنتج', 120);
  const benefit = clean(dna.productBenefit || dna.benefit || dna.product_details || dna.authoritativeFacts?.[0], 180);
  const custom = clean(customScriptText, 1200);
  return [
    {
      id: 'benefit_first',
      title: 'Benefit first',
      hook: benefit || ('اكتشف ' + product),
      structure: ['hook', 'product_reveal', 'product_benefit', 'cta'],
      requiresProductFactValidation: true,
      scriptText: custom || null
    },
    {
      id: 'product_first',
      title: 'Product first',
      hook: 'تعرّف على ' + product,
      structure: ['hook', 'product_reveal', 'product_benefit', 'cta'],
      requiresProductFactValidation: true,
      scriptText: custom || null
    },
    {
      id: 'problem_solution',
      title: 'Problem → solution',
      hook: 'حل عملي يبدأ من المنتج',
      structure: ['hook', 'product_reveal', 'product_benefit', 'cta'],
      requiresProductFactValidation: true,
      scriptText: custom || null
    }
  ];
}

export function buildCreativeCampaign(input = {}) {
  const suppliedDna = input.dna || {};
  const dna = Object.keys(suppliedDna).length ? suppliedDna : {
    productName: input.productName || input.product_name,
    productBenefit: input.productBenefit || input.product_benefit,
    product_details: input.productDetails || input.product_details,
    brand: input.brand,
    color: input.color
  };
  if (!hasProductIdentity(dna)) throw new Error('creative_campaign_product_dna_required');

  const selectedQuality = input.imageQuality || 'balanced';
  if (!IMAGE_QUALITY_OPTIONS.some(option => option.id === selectedQuality)) {
    throw new Error('creative_campaign_invalid_image_quality');
  }

  const customVideoScriptText = clean(input.videoScriptText || input.video_script_text, 1200);
  const scriptOptions = buildVideoScriptOptions(dna, customVideoScriptText);
  const selectedVideoScript = input.videoScriptId || scriptOptions[0].id;
  if (!scriptOptions.some(script => script.id === selectedVideoScript)) {
    throw new Error('creative_campaign_invalid_video_script');
  }

  const angles = CREATIVE_ANGLE_TYPES.map((type, index) => ({
    id: 'angle_' + (index + 1),
    type,
    source: 'single_product_image',
    requiresProviderArtifact: true,
    integrityRequired: true
  }));

  const staticAds = META_CREATIVE_FORMATS.map((format) => ({
    id: 'static_' + format.id,
    kind: 'image',
    format,
    requiresProviderArtifact: true,
    integrityRequired: true
  }));

  const script = scriptOptions.find(item => item.id === selectedVideoScript);
  const videos = [{
    id: 'video_reel_01',
    kind: 'video',
    spec: VIDEO_SPEC,
    scriptOptions,
    selectedScriptId: selectedVideoScript,
    selectedScript: script,
    selectedScriptText: customVideoScriptText || script.scriptText || script.hook,
    requiresProviderArtifact: true,
    integrityRequired: true
  }];

  return {
    version: CREATIVE_CAMPAIGN_VERSION,
    input: {
      source: 'single_product_image',
      imageProvided: Boolean(input.image_url || input.imageUrl),
      dna
    },
    customerControls: {
      imageQuality: { options: IMAGE_QUALITY_OPTIONS, selected: selectedQuality },
      videoScript: {
        options: scriptOptions,
        selected: selectedVideoScript,
        selectedText: customVideoScriptText || script.scriptText || script.hook
      }
    },
    deliverables: {
      enhancedSourceImage: {
        id: 'source_enhanced',
        selectedQuality,
        requiresProviderArtifact: true,
        integrityRequired: true
      },
      angles,
      staticAds,
      videos,
      copy: {
        primaryTextVariants: 3,
        headlineVariants: 3,
        ctaVariants: 2,
        requiresProductFactValidation: true
      }
    },
    metaReadiness: {
      requiredFormats: META_CREATIVE_FORMATS.map(({ id }) => id),
      policyReviewRequired: true,
      assetIntegrityRequired: true,
      sourceImageQualityRequired: true,
      videoScriptSelectionRequired: true,
      publishable: false,
      blockedReason: 'provider_artifacts_and_validation_required'
    }
  };
}

export function assertCreativeCampaignPublishable(campaign = {}) {
  if (!campaign?.deliverables?.enhancedSourceImage) throw new Error('creative_campaign_enhanced_source_missing');
  if (!campaign?.deliverables?.angles?.length) throw new Error('creative_campaign_angles_missing');
  if (!campaign?.deliverables?.staticAds?.length) throw new Error('creative_campaign_static_ads_missing');
  if (!campaign?.deliverables?.videos?.length) throw new Error('creative_campaign_video_missing');
  if (!campaign?.customerControls?.imageQuality?.selected) throw new Error('creative_campaign_image_quality_missing');
  if (!campaign?.customerControls?.videoScript?.selected) throw new Error('creative_campaign_video_script_missing');
  if (campaign?.metaReadiness?.publishable !== true) {
    throw new Error('creative_campaign_blocked:' + (campaign?.metaReadiness?.blockedReason || 'not_publishable'));
  }
  return true;
}
