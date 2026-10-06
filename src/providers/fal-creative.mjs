/**
 * Optional fal.ai Creative artifact provider.
 * No credentials are embedded. When FAL_KEY is absent this adapter is unavailable.
 *
 * Models verified against current fal.ai API docs:
 * - fal-ai/qwen-image-edit-2511 for product-preserving image edits/angles.
 * - fal-ai/qwen-image-edit for enhancement/editing.
 * - fal-ai/wan/v2.6/image-to-video for image-to-video with a text motion prompt.
 */
export function createFalCreativeProvider({
  falClient,
  imageModel = process.env.EASY_FAL_IMAGE_MODEL || 'fal-ai/qwen-image-edit-2511',
  videoModel = process.env.EASY_FAL_VIDEO_MODEL || 'fal-ai/wan/v2.6/image-to-video'
} = {}) {
  if (!falClient || typeof falClient.subscribe !== 'function') {
    throw new Error('fal_client_required');
  }

  const run = async (model, input) => {
    const result = await falClient.subscribe(model, { input });
    return result?.data ?? result;
  };

  const imageUrlFrom = (data) => data?.images?.[0]?.url || data?.image?.url || null;
  const videoUrlFrom = (data) => data?.video?.url || data?.videos?.[0]?.url || null;

  return {
    async enhanceSource({ imageUrl, quality }) {
      if (!imageUrl) throw new Error('source_image_required');
      const prompt = [
        'Enhance the supplied product photograph for commercial advertising.',
        'PRESERVE EXACTLY: product color, logo, printed text, letters, numbers, brand name, shape, major components, distinctive details.',
        'Do not redesign, replace, remove, recolor, rewrite, reshape, or invent any product feature.',
        'Only improve clarity, lighting, noise, and photographic presentation.',
        'Requested quality:', quality
      ].join(' ');
      const data = await run(imageModel, { prompt, image_urls: [imageUrl] });
      const url = imageUrlFrom(data);
      if (!url) throw new Error('fal_image_artifact_missing');
      return { id: 'source_enhanced', type: 'image', url, provider: 'fal.ai', model: imageModel };
    },

    async generateAngle({ imageUrl, angle, dna }) {
      if (!imageUrl) throw new Error('source_image_required');
      const prompt = [
        'Create a product advertising photograph using the supplied product image as the immutable reference.',
        'Requested camera/composition angle:', angle,
        'PRESERVE EXACTLY: color, logo, printed text, letters, numbers, brand name, shape, major components, distinctive details.',
        'Only change camera angle, background, environment, lighting, composition, and atmosphere.',
        'Never invent product features.',
        'Product DNA:', JSON.stringify(dna || {})
      ].join(' ');
      const data = await run(imageModel, { prompt, image_urls: [imageUrl] });
      const url = imageUrlFrom(data);
      if (!url) throw new Error('fal_image_artifact_missing');
      return { type: 'image', url, provider: 'fal.ai', model: imageModel };
    },

    async generateVideo({ imageUrl, scriptText, prompt }) {
      if (!imageUrl) throw new Error('source_image_required');
      if (!String(scriptText || '').trim()) throw new Error('video_script_required');
      const motionPrompt = [
        'Create an advertising product video from this exact product image.',
        'Do not alter the product identity, color, logo, printed text, letters, numbers, brand name, shape, major components, or distinctive details.',
        'Use the following customer-selected script as the exact narration/storyboard text; do not replace it:',
        String(scriptText).trim(),
        prompt || ''
      ].join(' ');
      const data = await run(videoModel, {
        image_url: imageUrl,
        prompt: motionPrompt,
        duration: 5
      });
      const url = videoUrlFrom(data);
      if (!url) throw new Error('fal_video_artifact_missing');
      return { type: 'video', url, provider: 'fal.ai', model: videoModel, scriptText: String(scriptText).trim() };
    }
  };
}
