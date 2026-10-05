import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCreativeImagePublishable, verifyCreativeImageIntegrity, createVisualIntegrityVerifier, createQwenVisionIntegrityAnalyzer, createQwenVisionIntegrityVerifier } from '../src/creative-image-integrity.mjs';

test('blocks image without visual verification', () => {
  const result = verifyCreativeImageIntegrity({
    dna: { title: 'Phone' },
    artifact: { url: 'https://example.test/image.png' }
  });
  assert.equal(result.passed, false);
  assert.equal(result.publishable, false);
  assert.equal(result.reason, 'missing_visual_verification');
  assert.throws(() => assertCreativeImagePublishable(result), /creative_image_blocked/);
});

test('blocks incomplete preservation evidence', () => {
  const result = verifyCreativeImageIntegrity({
    dna: { title: 'Phone' },
    artifact: { url: 'https://example.test/image.png' },
    verification: { color: true, logo: true }
  });
  assert.equal(result.passed, false);
  assert.ok(result.missing.includes('printedText'));
});

test('accepts only explicit positive evidence for every preservation rule', () => {
  const verification = {
    color: true, logo: true, printedText: true, brandName: true,
    shape: true, majorComponents: true, distinctiveDetails: true
  };
  const result = verifyCreativeImageIntegrity({
    dna: { title: 'Phone' },
    artifact: { url: 'https://example.test/image.png' },
    verification
  });
  assert.equal(result.passed, true);
  assert.equal(result.publishable, true);
  assert.equal(assertCreativeImagePublishable(result), true);
});


test('visual verifier adapter fails closed without a real analyzer', async () => {
  assert.throws(() => createVisualIntegrityVerifier(), /visual_integrity_analyzer_required/);
});

test('visual verifier adapter normalizes explicit analyzer evidence', async () => {
  const verifier = createVisualIntegrityVerifier({
    analyze: async () => ({
      evidenceVersion: 2,
      analyzer: 'vision-test',
      confidence: 0.98,
      color: true,
      logo: true,
      printedText: true,
      brandName: true,
      shape: true,
      majorComponents: true,
      distinctiveDetails: true
    })
  });
  const result = await verifier.verify({ artifact: { url: 'https://example.test/image.png' } });
  assert.equal(result.analyzer, 'vision-test');
  assert.equal(result.confidence, 0.98);
  assert.equal(result.distinctiveDetails, true);
});


test('Qwen vision analyzer accepts OpenAI-compatible JSON evidence', async () => {
  let request;
  const analyzer = createQwenVisionIntegrityAnalyzer({
    baseUrl: 'http://vision.local/',
    apiKey: 'test-key',
    model: 'qwen2.5vl:7b',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({
          color:true, logo:true, printedText:true, brandName:true,
          shape:true, majorComponents:true, distinctiveDetails:true,
          confidence:0.98
        }) } }]
      }), { status: 200 });
    }
  });
  const result = await analyzer.analyze({
    input: { sourceImageUrl: 'https://example.com/reference.jpg' },
    artifact: { viewUrl: 'https://example.com/generated.png' },
    dna: {}
  });
  assert.equal(request.url, 'http://vision.local/chat/completions');
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, 'qwen2.5vl:7b');
  assert.equal(body.messages[0].content.filter((p) => p.type === 'image_url').length, 2);
  assert.equal(result.logo, true);
});

test('Qwen verifier accepts a ComfyUI viewUrl artifact', async () => {
  const verifier = createQwenVisionIntegrityVerifier({
    baseUrl: 'http://vision.local',
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        color:true, logo:true, printedText:true, brandName:true,
        shape:true, majorComponents:true, distinctiveDetails:true
      }) } }]
    }), { status: 200 })
  });
  const result = await verifier.verify({
    input: { image_url: 'https://example.com/reference.jpg' },
    artifact: { type: 'image', viewUrl: 'https://comfy.local/view?filename=product.png' },
    dna: {}
  });
  assert.equal(result.logo, true);
  assert.equal(result.generatedArtifact, 'https://comfy.local/view?filename=product.png');
  const gate = verifyCreativeImageIntegrity({
    dna: {},
    artifact: { viewUrl: 'https://comfy.local/view?filename=product.png' },
    verification: result
  });
  assert.equal(gate.passed, true);
  assert.equal(gate.publishable, true);
});

test('Qwen vision failure remains fail-closed', async () => {
  const analyzer = createQwenVisionIntegrityAnalyzer({
    baseUrl: 'http://vision.local',
    fetchImpl: async () => new Response('bad', { status: 503 })
  });
  await assert.rejects(
    analyzer.analyze({
      input: { sourceImageUrl: 'https://example.com/reference.jpg' },
      artifact: { viewUrl: 'https://example.com/generated.png' },
      dna: {}
    }),
    /vision_request_failed:503/
  );
});


test('Qwen verifier fails closed on malformed model evidence', async () => {
  const verifier = createQwenVisionIntegrityVerifier({
    baseUrl: 'http://vision.local',
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [{ message: { content: 'not-json' } }]
    }), { status: 200 })
  });
  await assert.rejects(
    verifier.verify({
      input: { image_url: 'https://example.com/reference.jpg' },
      artifact: { viewUrl: 'https://comfy.local/view?filename=product.png' },
      dna: {}
    }),
    /vision_invalid_json/
  );
});
