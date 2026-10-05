const REQUIRED_PRESERVATIONS = [
  'color', 'logo', 'printedText', 'brandName', 'shape',
  'majorComponents', 'distinctiveDetails'
];

export function verifyCreativeImageIntegrity({ dna, artifact, verification } = {}) {
  if (!dna || typeof dna !== 'object') throw new Error('creative_dna_required');
  if (!artifact?.url && !artifact?.bytes) return blocked('missing_image_artifact');
  if (!verification || typeof verification !== 'object') return blocked('missing_visual_verification');

  const missing = REQUIRED_PRESERVATIONS.filter((key) => verification[key] !== true);
  if (missing.length) return blocked('visual_integrity_failed', missing);

  return {
    passed: true,
    publishable: true,
    missing: [],
    policy: 'product visual identity must be preserved'
  };
}

function blocked(reason, missing = []) {
  return {
    passed: false,
    publishable: false,
    reason,
    missing,
    policy: 'no visual verification means no production publishability'
  };
}

export function assertCreativeImagePublishable(result) {
  if (!result?.passed || result.publishable !== true) {
    throw new Error('creative_image_blocked:' + (result?.reason || 'invalid_integrity_result'));
  }
  return true;
}
