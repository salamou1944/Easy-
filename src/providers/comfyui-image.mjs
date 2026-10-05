export function createComfyUIImageProvider({
  baseUrl = process.env.EASY_COMFYUI_BASE_URL,
  workflowFactory,
  fetchImpl = globalThis.fetch,
  waitForResult = false,
  pollIntervalMs = Number(process.env.EASY_COMFYUI_POLL_INTERVAL_MS || 1000),
  timeoutMs = Number(process.env.EASY_COMFYUI_TIMEOUT_MS || 120000),
  sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
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

      if (!waitForResult) {
        return { provider: 'comfyui', promptId: payload.prompt_id, status: 'submitted' };
      }

      const started = Date.now();
      while (Date.now() - started <= timeoutMs) {
        const historyResponse = await fetchImpl(root + '/history/' + encodeURIComponent(payload.prompt_id), {
          method: 'GET',
          headers: { Accept: 'application/json' }
        });
        let history = null;
        try { history = await historyResponse.json(); } catch {}
        if (!historyResponse.ok) throw new Error('comfyui_history_failed:' + historyResponse.status);

        const entry = history?.[payload.prompt_id];
        if (entry?.status?.status_str === 'error') throw new Error('comfyui_generation_failed');
        if (entry?.outputs && typeof entry.outputs === 'object') {
          const artifact = extractComfyUIArtifact(entry.outputs);
          if (artifact) {
            return { provider: 'comfyui', promptId: payload.prompt_id, status: 'completed', artifact };
          }
        }
        await sleepImpl(Math.max(0, pollIntervalMs));
      }
      throw new Error('comfyui_generation_timeout');
    }
  };
}
function extractComfyUIArtifact(outputs) {
  for (const output of Object.values(outputs || {})) {
    for (const image of output?.images || []) {
      if (image?.filename) {
        return {
          type: 'image',
          filename: image.filename,
          subfolder: image.subfolder || '',
          typeHint: image.type || 'output'
        };
      }
    }
  }
  return null;
}\n