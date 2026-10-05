const REQUIRED_PRESERVATIONS = [
  'color', 'logo', 'printedText', 'brandName', 'shape',
  'majorComponents', 'distinctiveDetails'
];

export function verifyCreativeImageIntegrity({ dna, artifact, verification } = {}) {
  if (!dna || typeof dna !== 'object') throw new Error('creative_dna_required');
  if (!artifact?.url && !artifact?.viewUrl && !artifact?.bytes) return blocked('missing_image_artifact');
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


export function createVisualIntegrityVerifier({ analyze, requiredPreservations = REQUIRED_PRESERVATIONS } = {}) {
  if (typeof analyze !== 'function') throw new Error('visual_integrity_analyzer_required');
  return {
    async verify({ input, artifact, dna } = {}) {
      if (!artifact?.url && !artifact?.viewUrl && !artifact?.bytes) {
        throw new Error('visual_integrity_artifact_required');
      }
      const evidence = await analyze({ input, artifact, dna });
      if (!evidence || typeof evidence !== 'object') {
        throw new Error('visual_integrity_evidence_required');
      }
      const verification = {};
      for (const key of requiredPreservations) {
        verification[key] = evidence[key] === true;
      }
      return {
        ...verification,
        evidenceVersion: evidence.evidenceVersion || 1,
        analyzer: evidence.analyzer || 'external-visual-analyzer',
        referenceArtifact: evidence.referenceArtifact || null,
        generatedArtifact: evidence.generatedArtifact || artifact,
        confidence: typeof evidence.confidence === 'number' ? evidence.confidence : null
      };
    }
  };
}


export function createQwenVisionIntegrityAnalyzer({
  baseUrl = process.env.EASY_VISION_BASE_URL,
  apiKey = process.env.EASY_VISION_API_KEY,
  model = process.env.EASY_VISION_MODEL || 'qwen2.5vl:7b',
  fetchImpl = globalThis.fetch
} = {}) {
  if (!baseUrl) throw new Error('vision_base_url_required');
  if (typeof fetchImpl !== 'function') throw new Error('fetch_unavailable');

  const root = String(baseUrl).replace(/\/$/, '');
  return {
    async analyze({ input, artifact, dna } = {}) {
      const referenceImage = input?.sourceImageUrl || input?.image_url || input?.imageUrl;
      const generatedImage = artifact?.viewUrl || artifact?.url;
      if (!referenceImage || !generatedImage) throw new Error('vision_reference_and_generated_images_required');

      const prompt = [
        'Compare the reference product image and generated product image.',
        'Return JSON only with boolean fields: color, logo, printedText, brandName, shape, majorComponents, distinctiveDetails.',
        'Each field must be true only when the generated image preserves the corresponding product identity from the reference.',
        'If evidence is unclear, return false. Do not infer or assume preservation.',
        'Also return confidence as a number from 0 to 1.',
        'Product DNA:', JSON.stringify(dna || {})
      ].join('\\n');

      const response = await fetchImpl(root + '/chat/completions', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: 'Bearer ' + apiKey } : {})
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: referenceImage } },
            { type: 'image_url', image_url: { url: generatedImage } }
          ] }]
        })
      });
      let payload = null;
      try { payload = await response.json(); } catch {}
      if (!response.ok) throw new Error('vision_request_failed:' + response.status);
      const raw = payload?.choices?.[0]?.message?.content;
      if (!raw) throw new Error('vision_missing_result');
      let parsed;
      try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { throw new Error('vision_invalid_json'); }
      return { ...parsed, evidenceVersion: 1, analyzer: 'qwen-vision', referenceArtifact: referenceImage, generatedArtifact: generatedImage };
    }
  };
}


export function createQwenVisionIntegrityVerifier(options = {}) {
  const analyzer = createQwenVisionIntegrityAnalyzer(options);
  return createVisualIntegrityVerifier({
    analyze: (args) => analyzer.analyze(args)
  });
}
