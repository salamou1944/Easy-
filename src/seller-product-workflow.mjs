import { assertProductionRecord, createProductionPipeline } from './production-pipeline.mjs';

/**
 * Seller-facing product workflow boundary.
 *
 * This is deliberately provider-neutral: seller input enters once, the existing
 * Product DNA + Product Integrity + creative pipeline remains authoritative,
 * and the workflow returns only a validated result suitable for the next seller
 * action. External commerce providers are not required for this workflow.
 */
export function createSellerProductWorkflow({ creativeProvider = null, store }) {
  const runProduction = createProductionPipeline({ creativeProvider, store });

  return async function run(input) {
    const record = await runProduction(input);
    assertProductionRecord(record);

    return {
      version: 1,
      requestId: record.requestId,
      status: 'ready-for-seller-review',
      product: record.dna,
      creative: record.creative,
      integrity: record.integrity,
      provider: record.provider,
      nextAction: 'seller-review'
    };
  };
}

export async function runSellerProductWorkflow(input, options) {
  return createSellerProductWorkflow(options)(input);
}
