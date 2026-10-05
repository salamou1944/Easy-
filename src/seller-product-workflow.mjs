import { createProductionPipeline } from './production-pipeline.mjs';
import { createSalamou31ProductContentProvider } from './providers/salamou31-product-content.mjs';

function assertSellerReviewRecord(record) {
  if (!record?.requestId || record.status !== 'validated' || !record.integrity?.passed) {
    throw new Error('invalid_seller_review_record');
  }
  if (!['provider', 'deterministic-fallback'].includes(record.mode)) {
    throw new Error('invalid_seller_review_mode');
  }
  if (record.publishable !== (record.mode === 'provider')) {
    throw new Error('invalid_publishability_contract');
  }
  return true;
}

/**
 * Seller-facing product workflow boundary.
 *
 * This workflow may return a deterministic fallback for explicit seller review,
 * but it never marks that fallback publishable. Provider-backed output is the
 * only mode eligible for production publishing.
 */
export function createSellerProductWorkflow({ creativeProvider = null, store }) {
  const configuredProvider = creativeProvider || (
    process.env.EASY_PRODUCT_CONTENT_API_URL && process.env.EASY_PRODUCT_CONTENT_API_KEY
      ? createSalamou31ProductContentProvider()
      : null
  );
  const runProduction = createProductionPipeline({ creativeProvider: configuredProvider, store });

  return async function run(input) {
    const record = await runProduction(input);
    assertSellerReviewRecord(record);

    return {
      version: 1,
      requestId: record.requestId,
      status: 'ready-for-seller-review',
      product: record.dna,
      creative: record.creative,
      integrity: record.integrity,
      provider: record.provider,
      publishable: record.publishable,
      nextAction: 'seller-review'
    };
  };
}

export async function runSellerProductWorkflow(input, options) {
  return createSellerProductWorkflow(options)(input);
}
