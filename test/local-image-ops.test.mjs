import test from 'node:test';
import assert from 'node:assert/strict';
import { localCreativeCapabilities, removeBackground, upscaleImage } from '../src/local-image-ops.mjs';
test('local creative operations fail closed when tools are not configured', async () => {
  const oldRembg = process.env.REMBG_COMMAND, oldUpscayl = process.env.UPSCAYL_COMMAND;
  delete process.env.REMBG_COMMAND; delete process.env.UPSCAYL_COMMAND;
  try {
    assert.deepEqual(localCreativeCapabilities(), { backgroundRemoval: false, upscaling: false, providerNeutral: true, fakeSuccess: false });
    assert.deepEqual(await removeBackground('/tmp/in.png', '/tmp/out.png'), { status: 'blocked', capability: 'background_removal', reason: 'not_configured' });
    assert.deepEqual(await upscaleImage('/tmp/in.png', '/tmp/out.png'), { status: 'blocked', capability: 'upscaling', reason: 'not_configured' });
  } finally {
    if (oldRembg === undefined) delete process.env.REMBG_COMMAND; else process.env.REMBG_COMMAND = oldRembg;
    if (oldUpscayl === undefined) delete process.env.UPSCAYL_COMMAND; else process.env.UPSCAYL_COMMAND = oldUpscayl;
  }
});
