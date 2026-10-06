import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createLocalMediaExecutor } from '../src/local-media-executor.mjs';

test('real rembg runner is executable when python rembg is installed', { skip: !process.env.RUN_REAL_LOCAL_MEDIA }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'easy-rembg-test-'));
  const input = path.join(dir, 'input.png');
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  await fs.writeFile(input, Buffer.from(png, 'base64'));
  const executor = createLocalMediaExecutor();
  const result = await executor.run({ sourceImageUrl: 'file://' + input, needsBackgroundRemoval: true });
  if (result.status === 'LOCAL_CAPABILITY_FAILED') assert.fail(result.error || 'rembg execution failed');
  assert.equal(result.status, 'LOCAL_CAPABILITY_EXECUTED');
  assert.ok(result.steps[0].artifactBytes > 0);
  assert.ok(result.steps[0].artifactPath.endsWith('rembg-output.png'));
});
