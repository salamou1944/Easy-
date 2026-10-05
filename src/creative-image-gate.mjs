import { verifyCreativeImageIntegrity, assertCreativeImagePublishable } from './creative-image-integrity.mjs';

export async function runCreativeImageGate(input, { provider, verifier } = {}) {
  if (!provider || typeof provider.generate !== 'function') {
    throw new Error('creative_image_provider_required');
  }
  if (!verifier || typeof verifier.verify !== 'function') {
    throw new Error('creative_image_verifier_required');
  }

  let generated;
  try {
    generated = await provider.generate(input);
  } catch (error) {
    throw new Error('creative_image_provider_blocked:' + (error?.message || 'provider_error'));
  }

  const artifact = generated?.artifact;
  if (!artifact) throw new Error('creative_image_missing_artifact');

  let verification;
  try {
    verification = await verifier.verify({ input, artifact, dna: input?.dna });
  } catch (error) {
    throw new Error('creative_image_verification_failed:' + (error?.message || 'verifier_error'));
  }

  const integrity = verifyCreativeImageIntegrity({
    dna: input?.dna,
    artifact,
    verification
  });
  assertCreativeImagePublishable(integrity);

  return {
    version: 1,
    status: 'validated',
    provider: generated.provider || 'external',
    artifact,
    integrity,
    publishable: true
  };
}
