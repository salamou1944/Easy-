import test from 'node:test';
import assert from 'node:assert/strict';
import { createComfyUIImageProvider } from '../src/providers/comfyui-image.mjs';

test('submits a workflow to ComfyUI and requires a prompt id', async () => {
  const calls = [];
  const provider = createComfyUIImageProvider({
    baseUrl: 'http://comfyui.test/',
    workflowFactory: (input) => ({
      '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: input.model } }
    }),
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, json: async () => ({ prompt_id: 'p-123' }) };
    }
  });
  const result = await provider.generate({ model: 'model.safetensors' });
  assert.equal(result.provider, 'comfyui');
  assert.equal(result.promptId, 'p-123');
  assert.equal(calls[0].url, 'http://comfyui.test/prompt');
});

test('fails closed when ComfyUI accepts without prompt id', async () => {
  const provider = createComfyUIImageProvider({
    baseUrl: 'http://comfyui.test',
    workflowFactory: () => ({ '1': {} }),
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) })
  });
  await assert.rejects(() => provider.generate({}), /comfyui_missing_prompt_id/);
});
