/**
 * Reliability patterns extracted from COLLECTION/SKILLS/HIGGSFIELD_RELIABILITY_PATTERNS_2026-10-06.
 * This strengthens the existing provider-adapter boundary without importing provider-specific automation.
 */

const DEFAULT_TRANSIENT_CODES = new Set([
  'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', '429', '500', '502', '503', '504'
]);

export const CREATIVE_PROVIDER_MODELS = Object.freeze({
  'fal.ai': Object.freeze({
    image: 'fal-ai/qwen-image-edit-2511',
    video: 'fal-ai/wan/v2.6/image-to-video',
    verifiedCapabilityBoundary: 'adapter-only; runtime access must be independently preflighted'
  })
});

export function classifyProviderError(error) {
  const status = Number(error?.status || error?.statusCode || error?.response?.status || 0);
  const code = String(error?.code || error?.name || '');
  if (status === 401 || status === 403 || /auth|credential|api.?key/i.test(String(error?.message || ''))) {
    return { category: 'authentication', transient: false, status, code };
  }
  if (status === 400 || /validation|invalid|schema/i.test(String(error?.message || ''))) {
    return { category: 'validation', transient: false, status, code };
  }
  if (status === 429 || status >= 500 || DEFAULT_TRANSIENT_CODES.has(String(status)) || DEFAULT_TRANSIENT_CODES.has(code)) {
    return { category: 'transient_provider', transient: true, status, code };
  }
  if (/network|timeout|econn|dns/i.test(String(error?.message || ''))) {
    return { category: 'network', transient: true, status, code };
  }
  return { category: 'provider', transient: false, status, code };
}

export function createProviderCircuitBreaker({ failureThreshold = 3, recoveryMs = 30000 } = {}) {
  let failures = 0;
  let openedAt = 0;

  return {
    state() {
      if (openedAt && Date.now() - openedAt >= recoveryMs) return 'half_open';
      return openedAt ? 'open' : 'closed';
    },
    beforeCall() {
      if (this.state() === 'open') throw new Error('creative_provider_circuit_open');
    },
    success() {
      failures = 0;
      openedAt = 0;
    },
    failure() {
      failures += 1;
      if (failures >= failureThreshold) openedAt = Date.now();
    }
  };
}

export function createIdempotencyKey(input = {}) {
  const raw = JSON.stringify(input, Object.keys(input).sort());
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) hash = Math.imul(hash ^ raw.charCodeAt(i), 16777619);
  return 'creative-' + (hash >>> 0).toString(16);
}

export async function withProviderReliability(fn, {
  circuit = createProviderCircuitBreaker(),
  maxRetries = 2,
  baseDelayMs = 150,
  sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  idempotencyKey
} = {}) {
  circuit.beforeCall();
  let attempt = 0;
  while (true) {
    try {
      const value = await fn({ attempt, idempotencyKey });
      circuit.success();
      return { ok: true, attempt, idempotencyKey, value };
    } catch (error) {
      const classification = classifyProviderError(error);
      circuit.failure();
      if (!classification.transient || attempt >= maxRetries) {
        return {
          ok: false,
          attempt,
          idempotencyKey,
          error: {
            category: classification.category,
            status: classification.status,
            code: classification.code,
            message: String(error?.message || error)
          }
        };
      }
      const retryAfter = Number(error?.retryAfterMs || error?.retryAfter || 0);
      const delay = retryAfter > 0
        ? retryAfter
        : Math.min(5000, baseDelayMs * (2 ** attempt)) + Math.floor(Math.random() * 50);
      await sleep(delay);
      attempt += 1;
    }
  }
}

export function providerPreflight({ providerConfigured = false, sourceImageUrl = '', model = '' } = {}) {
  const checks = {
    configured: providerConfigured === true,
    sourceReachableInput: /^https?:\\/\\//.test(String(sourceImageUrl)),
    modelKnown: Object.values(CREATIVE_PROVIDER_MODELS).some(x => x.image === model || x.video === model)
  };
  return {
    ready: Object.values(checks).every(Boolean),
    checks,
    executionAllowed: Object.values(checks).every(Boolean),
    claimBoundary: 'preflight is not generation proof'
  };
}
