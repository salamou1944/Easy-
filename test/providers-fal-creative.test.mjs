import test from 'node:test';
import assert from 'node:assert/strict';
import { createFalCreativeProvider } from '../src/providers/fal-creative.mjs';

test('fal Creative provider maps image and video artifacts without fabricating output', async () => {
  const calls = [];
  const falClient = {
    async subscribe(model, options) {
      calls.push({ model, input: options.input });
      if (model.includes('image-edit')) {
        return { data: { images: [{ url: 'https://example.com/generated.jpg' }] } };
      }
      return { data: { video: { url: 'https://example.com/generated.mp4' } } };
    }
  };
  const provider = createFalCreativeProvider({ falClient });

  const image = await provider.generateAngle({
    imageUrl: 'https://example.com/source.jpg',
    angle: 'close_up',
    dna: { productName: 'Bag', color: 'black' }
  });
  const video = await provider.generateVideo({
    imageUrl: image.url,
    scriptText: 'النص الذي اختاره العميل',
  });

  assert.equal(image.url, 'https://example.com/generated.jpg');
  assert.equal(video.url, 'https://example.com/generated.mp4');
  assert.equal(video.scriptText, 'النص الذي اختاره العميل');
  assert.equal(calls.length, 2);
  assert.ok(calls[0].input.prompt.includes('PRESERVE EXACTLY'));
  assert.equal(calls[1].input.image_url, image.url);
});

test('fal Creative provider refuses missing source image and script', async () => {
  const provider = createFalCreativeProvider({
    falClient: { subscribe: async () => ({ data: { video: { url: 'x' } } }) }
  });
  await assert.rejects(() => provider.generateAngle({}), /source_image_required/);
  await assert.rejects(() => provider.generateVideo({ imageUrl: 'https://example.com/x.jpg' }), /video_script_required/);
});
