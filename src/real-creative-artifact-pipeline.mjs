import { createFalCreativeProvider } from './providers/fal-creative.mjs';
import { createQwenVisionIntegrityVerifier } from './creative-image-integrity.mjs';
import { evaluateCreativeCampaignArtifacts } from './creative-campaign-artifact-gate.mjs';
import { buildMetaReadiness } from './meta-readiness-gate.mjs';
import {
  CREATIVE_PROVIDER_MODELS,
  createProviderCircuitBreaker,
  createIdempotencyKey,
  withProviderReliability,
  providerPreflight
} from './creative-provider-reliability.mjs';

export function createRealCreativeArtifactPipeline({
  falClient,
  vision = {},
  imageModel,
  videoModel,
  providerConfigured = Boolean(falClient)
} = {}) {
  if (!falClient) {
    return {
      preflight({ sourceImageUrl = '' } = {}) {
        return providerPreflight({
          providerConfigured,
          sourceImageUrl,
          model: imageModel || CREATIVE_PROVIDER_MODELS['fal.ai'].image
        });
      },
      async run() {
        return {
          status: 'BLOCKED_EXTERNAL_DEPENDENCY',
          publishable: false,
          reason: 'fal_client_required',
          claimBoundary: 'no provider execution occurred'
        };
      }
    };
  }

  const provider = createFalCreativeProvider({ falClient, imageModel, videoModel });
  const verifier = createQwenVisionIntegrityVerifier(vision);
  const circuit = createProviderCircuitBreaker();

  return {
    preflight({ sourceImageUrl = '' } = {}) {
      return providerPreflight({
        providerConfigured,
        sourceImageUrl,
        model: imageModel || CREATIVE_PROVIDER_MODELS['fal.ai'].image
      });
    },

    async run({ sourceImageUrl, dna, campaign, angles = [], staticAds = [] } = {}) {
      if (!sourceImageUrl) throw new Error('source_image_required');
      if (!campaign?.imageQuality) throw new Error('image_quality_required');
      if (!campaign?.videoScriptText?.trim()) throw new Error('video_script_required');

      const preflight = this.preflight({ sourceImageUrl });
      if (!preflight.ready) {
        return { status: 'BLOCKED_EXTERNAL_DEPENDENCY', publishable: false, preflight };
      }

      const integrity = [];
      const runProvider = (label, fn, input) =>
        withProviderReliability(fn, {
          circuit,
          idempotencyKey: createIdempotencyKey({ label, sourceImageUrl, input })
        });

      const sourceResult = await runProvider('enhanceSource', () => provider.enhanceSource({
        imageUrl: sourceImageUrl,
        quality: campaign.imageQuality
      }), { quality: campaign.imageQuality });
      if (!sourceResult.ok) {
        return { status: 'BLOCKED_PROVIDER_ERROR', publishable: false, preflight, error: sourceResult.error };
      }
      const source = sourceResult.value;

      const verify = async (artifact, inputUrl) => {
        const evidence = await verifier.verify({
          input: { sourceImageUrl: inputUrl },
          artifact,
          dna
        });
        const result = {
          artifactId: artifact.id || artifact.type,
          passed: Object.values(evidence).every(value => value !== false),
          publishable: Object.values(evidence).every(value => value !== false),
          evidence
        };
        integrity.push(result);
        return result;
      };

      if (!(await verify(source, sourceImageUrl)).publishable) {
        return { status: 'BLOCKED_INTEGRITY', publishable: false, preflight, integrity };
      }

      const angleArtifacts = [];
      for (const angle of angles) {
        const result = await runProvider('angle:' + angle.id, () => provider.generateAngle({
          imageUrl: source.url,
          angle: angle.description || angle.id,
          dna
        }), { angle: angle.id });
        if (!result.ok) return { status: 'BLOCKED_PROVIDER_ERROR', publishable: false, preflight, integrity, error: result.error };
        const artifact = { ...result.value, id: angle.id };
        if (!(await verify(artifact, sourceImageUrl)).publishable) {
          return { status: 'BLOCKED_INTEGRITY', publishable: false, preflight, integrity };
        }
        angleArtifacts.push(artifact);
      }

      const videoResult = await runProvider('video:video_reel_01', () => provider.generateVideo({
        imageUrl: source.url,
        scriptText: campaign.videoScriptText,
        prompt: campaign.videoPrompt || ''
      }), { scriptText: campaign.videoScriptText });
      if (!videoResult.ok) {
        return { status: 'BLOCKED_PROVIDER_ERROR', publishable: false, preflight, integrity, error: videoResult.error };
      }
      const video = { ...videoResult.value, id: 'video_reel_01' };
      if (!(await verify(video, sourceImageUrl)).publishable) {
        return { status: 'BLOCKED_INTEGRITY', publishable: false, preflight, integrity };
      }

      const artifacts = {
        enhancedSourceImage: source,
        angles: angleArtifacts,
        staticAds,
        videos: [video],
        copy: {}
      };

      const metaReadiness = buildMetaReadiness({
        images: [],
        videos: [],
        copy: artifacts.copy,
        integrity
      });

      const campaignGate = evaluateCreativeCampaignArtifacts({
        campaign: {
          deliverables: {
            ...campaign.deliverables,
            angles: angles.length ? angles : campaign.deliverables?.angles || [],
            staticAds: campaign.deliverables?.staticAds || []
          },
          customerControls: campaign.customerControls
        },
        artifacts,
        integrity,
        metaReadiness
      });

      return {
        status: campaignGate.publishable ? 'READY' : 'BLOCKED_CAMPAIGN_INCOMPLETE',
        publishable: campaignGate.publishable,
        provider: 'fal.ai',
        preflight,
        source,
        angles: angleArtifacts,
        video,
        integrity,
        metaReadiness,
        campaignGate,
        exactVideoScriptText: campaign.videoScriptText,
        claimBoundary: campaignGate.publishable
          ? 'real provider artifacts plus validators completed'
          : 'real provider work may have completed partially, but publishability remains blocked'
      };
    }
  };
}
