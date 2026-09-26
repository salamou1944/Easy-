import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 120000;
function clean(value) { return typeof value === 'string' && value.trim() ? value.trim() : ''; }
function commandFromEnv(name) { return clean(process.env[name]) || null; }
async function run(command, args, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  try {
    const result = await execFileAsync(command, args, { timeout: timeoutMs, maxBuffer: 2 * 1024 * 1024 });
    return { status: 'completed', command, stdout: result.stdout || '', stderr: result.stderr || '' };
  } catch (error) {
    if (error?.code === 'ENOENT') return { status: 'unavailable', command, reason: 'command_not_found' };
    if (error?.killed || error?.code === 'ETIMEDOUT') return { status: 'blocked', command, reason: 'timeout' };
    return { status: 'failed', command, reason: error?.code || error?.name || 'execution_error', exitCode: typeof error?.code === 'number' ? error.code : null, stderr: error?.stderr || '' };
  }
}
export async function removeBackground(inputPath, outputPath, options = {}) {
  const command = commandFromEnv('REMBG_COMMAND');
  if (!command) return { status: 'blocked', capability: 'background_removal', reason: 'not_configured' };
  return { capability: 'background_removal', ...await run(command, ['i', inputPath, outputPath], options) };
}
export async function upscaleImage(inputPath, outputPath, options = {}) {
  const command = commandFromEnv('UPSCAYL_COMMAND');
  if (!command) return { status: 'blocked', capability: 'upscaling', reason: 'not_configured' };
  return { capability: 'upscaling', ...await run(command, ['-i', inputPath, '-o', outputPath], options) };
}
export function localCreativeCapabilities() {
  return { backgroundRemoval: Boolean(commandFromEnv('REMBG_COMMAND')), upscaling: Boolean(commandFromEnv('UPSCAYL_COMMAND')), providerNeutral: true, fakeSuccess: false };
}
