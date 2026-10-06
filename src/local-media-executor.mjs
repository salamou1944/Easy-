import { getLocalMediaPlan, assertNoIntegrityMutationPolicy } from './local-media-capabilities.mjs';

export function createLocalMediaExecutor({ execute } = {}) {
  return {
    async run({ sourceImageUrl, needsBackgroundRemoval = false, needsUpscaling = false } = {}) {
      const plan = getLocalMediaPlan({ needsBackgroundRemoval, needsUpscaling });
      if (!plan.steps.length) {
        return { status: 'NO_LOCAL_MEDIA_STEP', publishable: true, sourceImageUrl, steps: [] };
      }
      if (typeof execute !== 'function') {
        return {
          status: 'LOCAL_CAPABILITY_UNAVAILABLE',
          publishable: false,
          sourceImageUrl,
          steps: plan.steps.map(step => ({
            ...step,
            integrityPolicy: assertNoIntegrityMutationPolicy(step.command)
          })),
          claimBoundary: 'local capability was not executed'
        };
      }

      let currentUrl = sourceImageUrl;
      const evidence = [];
      for (const step of plan.steps) {
        const integrityPolicy = assertNoIntegrityMutationPolicy(step.command);
        const result = await execute({
          capability: step.command,
          inputUrl: currentUrl,
          integrityPolicy
        });
        if (!result?.ok || !result?.outputUrl) {
          return {
            status: 'LOCAL_CAPABILITY_FAILED',
            publishable: false,
            sourceImageUrl,
            steps: [...evidence, { capability: step.command, result }],
            claimBoundary: 'local capability execution failed or produced no artifact'
          };
        }
        evidence.push({
          capability: step.command,
          execution: 'executed',
          outputUrl: result.outputUrl,
          evidence: result.evidence || null
        });
        currentUrl = result.outputUrl;
      }

      return {
        status: 'LOCAL_CAPABILITY_EXECUTED',
        publishable: true,
        sourceImageUrl,
        outputUrl: currentUrl,
        steps: evidence,
        claimBoundary: 'local capability execution returned an artifact; integrity verification remains required'
      };
    }
  };
}
