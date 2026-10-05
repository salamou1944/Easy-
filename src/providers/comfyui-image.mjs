export function createComfyUIImageProvider({
  baseUrl = process.env.EASY_COMFYUI_BASE_URL,
  workflowFactory,
  fetchImpl = globalThis.fetch
} = {}) {
  if (!baseUrl) throw new Error('comfyui_base_url_required');
  if (typeof workflowFactory !== 'function') throw new Error('comfyui_workflow_factory_required');
  if (typeof fetchImpl !== 'function') throw new Error('fetch_unavailable');

  const root = String(baseUrl).replace(/\/$/, '');

  return {
    async generate(input) {
      const workflow = workflowFactory(input);
      if (!workflow || typeof workflow !== 'object') throw new Error('comfyui_invalid_workflow');

      const response = await fetchImpl(root + '/prompt', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
      });
      let payload = null;
      try { payload = await response.json(); } catch {}
      if (!response.ok) throw new Error('comfyui_request_failed:' + response.status);
      if (!payload?.prompt_id) throw new Error('comfyui_missing_prompt_id');

      return { provider: 'comfyui', promptId: payload.prompt_id, status: 'submitted' };
    }
  };
}
