/**
 * EASY Creative Campaign artifact gate.
 * A campaign is publishable only when every declared provider artifact exists,
 * every required visual artifact has explicit integrity evidence, and Meta
 * readiness has been positively established by an upstream validator.
 */
function artifactPresent(artifact) {
  return Boolean(artifact && (artifact.url || artifact.viewUrl || artifact.bytes || artifact.id));
}

function listMissingArtifacts(campaign, artifacts = {}) {
  const missing = [];
  if (!artifactPresent(artifacts.enhancedSourceImage)) missing.push('enhancedSourceImage');

  const angleArtifacts = Array.isArray(artifacts.angles) ? artifacts.angles : [];
  for (const angle of campaign?.deliverables?.angles || []) {
    if (!angleArtifacts.some(item => item?.id === angle.id && artifactPresent(item))) missing.push(angle.id);
  }

  const staticArtifacts = Array.isArray(artifacts.staticAds) ? artifacts.staticAds : [];
  for (const ad of campaign?.deliverables?.staticAds || []) {
    if (!staticArtifacts.some(item => item?.id === ad.id && artifactPresent(item))) missing.push(ad.id);
  }

  const videoArtifacts = Array.isArray(artifacts.videos) ? artifacts.videos : [];
  for (const video of campaign?.deliverables?.videos || []) {
    if (!videoArtifacts.some(item => item?.id === video.id && artifactPresent(item))) missing.push(video.id);
  }

  if (!artifacts.copy || typeof artifacts.copy !== 'object') missing.push('copy');
  return missing;
}

export function evaluateCreativeCampaignArtifacts({ campaign, artifacts = {}, integrity = [], metaReadiness = {} } = {}) {
  if (!campaign?.deliverables) throw new Error('creative_campaign_required');

  const missingArtifacts = listMissingArtifacts(campaign, artifacts);
  const integrityResults = Array.isArray(integrity) ? integrity : [];
  const failedIntegrity = integrityResults
    .filter(result => result?.publishable !== true || result?.passed !== true)
    .map(result => result?.artifactId || 'unknown_integrity_artifact');

  const exactScriptSelected = Boolean(campaign?.customerControls?.videoScript?.selectedText?.trim());
  const qualitySelected = Boolean(campaign?.customerControls?.imageQuality?.selected);

  const blockedReasons = [];
  if (missingArtifacts.length) blockedReasons.push('provider_artifacts_missing');
  if (failedIntegrity.length) blockedReasons.push('visual_integrity_failed');
  if (!qualitySelected) blockedReasons.push('image_quality_not_selected');
  if (!exactScriptSelected) blockedReasons.push('video_script_text_not_selected');
  if (metaReadiness?.publishable !== true) blockedReasons.push('meta_readiness_not_verified');

  return {
    publishable: blockedReasons.length === 0,
    missingArtifacts,
    failedIntegrity,
    customerControls: {
      imageQualitySelected: qualitySelected,
      exactVideoScriptSelected: exactScriptSelected
    },
    metaReadinessVerified: metaReadiness?.publishable === true,
    blockedReasons
  };
}

export function assertCreativeCampaignArtifactsPublishable(result = {}) {
  if (result.publishable !== true) {
    throw new Error('creative_campaign_artifacts_blocked:' + (result.blockedReasons || ['unknown']).join('|'));
  }
  return true;
}
