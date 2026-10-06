import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { getLocalMediaPlan, assertNoIntegrityMutationPolicy } from './local-media-capabilities.mjs';

const execFileAsync = promisify(execFile);

async function downloadInput(inputUrl, target) {
  if (String(inputUrl).startsWith('file://')) {
    await fs.copyFile(new URL(inputUrl), target);
    return;
  }
  const response = await fetch(inputUrl, { headers: { Accept: 'image/*' } });
  if (!response.ok) throw new Error('local_media_input_download_failed:' + response.status);
  await fs.writeFile(target, Buffer.from(await response.arrayBuffer()));
}

async function runCommand(command, args, timeoutMs) {
  return execFileAsync(command, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 });
}

export function createLocalMediaExecutor({
  execute,
  tmpRoot = process.env.EASY_LOCAL_MEDIA_TMP || os.tmpdir(),
  rembgPython = process.env.EASY_REMBG_PYTHON || 'python3',
  timeoutMs = Number(process.env.EASY_LOCAL_MEDIA_TIMEOUT_MS || 120000)
} = {}) {
  const injected = typeof execute === 'function';

  return {
    async run({ sourceImageUrl, needsBackgroundRemoval = false, needsUpscaling = false } = {}) {
      const plan = getLocalMediaPlan({ needsBackgroundRemoval, needsUpscaling });
      if (!plan.steps.length) return { status: 'NO_LOCAL_MEDIA_STEP', publishable: true, sourceImageUrl, steps: [] };

      if (injected) return runInjected(plan, sourceImageUrl, execute);

      const workspace = await fs.mkdtemp(path.join(tmpRoot, 'easy-local-media-'));
      let currentPath = path.join(workspace, 'input');
      try {
        await downloadInput(sourceImageUrl, currentPath);
        const evidence = [];

        for (const step of plan.steps) {
          const integrityPolicy = assertNoIntegrityMutationPolicy(step.command);
          const outputPath = path.join(workspace, step.command + '-output.png');

          if (step.command === 'rembg') {
            await runCommand(rembgPython, ['-m', 'rembg', 'i', currentPath, outputPath], timeoutMs);
          } else {
            return {
              status: 'LOCAL_CAPABILITY_UNAVAILABLE',
              publishable: false,
              sourceImageUrl,
              steps: [...evidence, { capability: step.command, integrityPolicy }],
              claimBoundary: 'Upscayl requires an installed/configured CLI adapter before execution can be claimed'
            };
          }

          const stat = await fs.stat(outputPath).catch(() => null);
          if (!stat?.size) {
            return {
              status: 'LOCAL_CAPABILITY_FAILED',
              publishable: false,
              sourceImageUrl,
              steps: [...evidence, { capability: step.command, error: 'artifact_missing' }],
              claimBoundary: 'local capability executed without a verifiable artifact'
            };
          }

          evidence.push({
            capability: step.command,
            execution: 'executed',
            artifactPath: outputPath,
            artifactBytes: stat.size,
            evidence: { runner: rembgPython, verifiedFile: true }
          });
          currentPath = outputPath;
        }

        return {
          status: 'LOCAL_CAPABILITY_EXECUTED',
          publishable: true,
          sourceImageUrl,
          outputPath: currentPath,
          steps: evidence,
          claimBoundary: 'local capability executed and produced a verifiable local artifact; provider handoff and integrity verification remain required'
        };
      } catch (error) {
        return {
          status: 'LOCAL_CAPABILITY_FAILED',
          publishable: false,
          sourceImageUrl,
          error: String(error?.message || error),
          claimBoundary: 'local capability execution failed'
        };
      }
    }
  };
}

async function runInjected(plan, sourceImageUrl, execute) {
  let currentUrl = sourceImageUrl;
  const evidence = [];
  for (const step of plan.steps) {
    const integrityPolicy = assertNoIntegrityMutationPolicy(step.command);
    const result = await execute({ capability: step.command, inputUrl: currentUrl, integrityPolicy });
    if (!result?.ok || !result?.outputUrl) {
      return { status: 'LOCAL_CAPABILITY_FAILED', publishable: false, sourceImageUrl, steps: [...evidence, { capability: step.command, result }], claimBoundary: 'local capability execution failed or produced no artifact' };
    }
    evidence.push({ capability: step.command, execution: 'executed', outputUrl: result.outputUrl, evidence: result.evidence || null });
    currentUrl = result.outputUrl;
  }
  return { status: 'LOCAL_CAPABILITY_EXECUTED', publishable: true, sourceImageUrl, outputUrl: currentUrl, steps: evidence, claimBoundary: 'injected local capability execution returned an artifact; integrity verification remains required' };
}
