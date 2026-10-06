/**
 * Collection-derived local media capability boundary.
 * Sources: COLLECTION/MEDIA_CREATIVE and COLLECTION/MASTER/LEVERAGE_CLOSURE_MATRIX.
 * These adapters are optional and never masquerade as AI generation.
 */
export const LOCAL_MEDIA_CAPABILITIES = Object.freeze({
  rembg: Object.freeze({ capability:'background_removal', execution:'local', command:'rembg', paidProviderRequired:false }),
  upscayl: Object.freeze({ capability:'image_upscaling', execution:'local', command:'upscayl', paidProviderRequired:false })
});

export function getLocalMediaPlan({ needsBackgroundRemoval=false, needsUpscaling=false }={}) {
  const steps=[];
  if (needsBackgroundRemoval) steps.push(LOCAL_MEDIA_CAPABILITIES.rembg);
  if (needsUpscaling) steps.push(LOCAL_MEDIA_CAPABILITIES.upscayl);
  return {
    steps,
    providerRequired:false,
    status: steps.length ? 'LOCAL_CAPABILITIES_AVAILABLE' : 'NO_LOCAL_MEDIA_STEP',
    claimBoundary:'capability availability is not execution proof'
  };
}

export function assertNoIntegrityMutationPolicy(capability) {
  if (!capability || !LOCAL_MEDIA_CAPABILITIES[capability]) throw new Error('unknown_local_media_capability');
  return {
    capability,
    preserve:['color','logo','printedText','letters','numbers','brandName','shape','majorComponents','distinctiveDetails'],
    mutationAllowed:['background','environment','lighting','composition','surroundingObjects','atmosphere'],
    status:'POLICY_REQUIRED_BEFORE_EXECUTION'
  };
}
