import { createFalCreativeProvider } from './providers/fal-creative.mjs';
import { createQwenVisionIntegrityVerifier } from './creative-image-integrity.mjs';

export function createRealCreativeArtifactPipeline({
  falClient,
  vision = {},
  imageModel,
  videoModel
} = {}) {
  const provider = createFalCreativeProvider({ falClient, imageModel, videoModel });
  const verifier = createQwenVisionIntegrityVerifier(vision);

  return {
    async run({ sourceImageUrl, dna, campaign, angles = [] } = {}) {
      if (!sourceImageUrl) throw new Error('source_image_required');
      if (!campaign?.imageQuality) throw new Error('image_quality_required');
      if (!campaign?.videoScriptText?.trim()) throw new Error('video_script_required');

      const source = await provider.enhanceSource({
        imageUrl: sourceImageUrl,
        quality: campaign.imageQuality
      });

      const integrity = [];
      const verify = async (artifact, inputUrl) => {
        const evidence = await verifier.verify({
          input: { sourceImageUrl: inputUrl },
          artifact,
          dna
        });
        const result = {
          artifactId: artifact.id || artifact.type,
          passed: Object.values(evidence).includes(false) ? false : true,
          publishable: Object.values(evidence).includes(false) ? false : true,
          evidence
        };
        integrity.push(result);
        if (!result.publishable) throw new Error('creative_visual_integrity_blocked');
        return result;
      };

      await verify(source, sourceImageUrl);

      const angleArtifacts = [];
      for (const angle of angles) {
        const generated = await provider.generateAngle({
          imageUrl: source.url,
          angle: angle.description || angle.id,
          dna
        });
        const artifact = { ...generated, id: angle.id };
        await verify(artifact, sourceImageUrl);
        angleArtifacts.push(artifact);
      }

      const video = await provider.generateVideo({
        imageUrl: source.url,
        scriptText: campaign.videoScriptText,
        prompt: campaign.videoPrompt || ''
      });

      return {
        provider: 'fal.ai',
        source,
        angles: angleArtifacts,
        video,
        integrity,
        exactVideoScriptText: campaign.videoScriptText
      };
    }
  };
}
