import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalMediaExecutor } from '../src/local-media-executor.mjs';

test('local media executor records real injected capability execution', async () => {
  const calls = [];
  const executor = createLocalMediaExecutor({
    execute: async (input) => {
      calls.push(input);
      return { ok:true, outputUrl:'file:///tmp/upscaled.png', evidence:{ runner:'test-injected' } };
    }
  });
  const result = await executor.run({ sourceImageUrl:'https://example.com/product.jpg', needsUpscaling:true });
  assert.equal(result.status,'LOCAL_CAPABILITY_EXECUTED');
  assert.equal(result.publishable,true);
  assert.equal(result.outputUrl,'file:///tmp/upscaled.png');
  assert.equal(calls[0].capability,'upscayl');
  assert.ok(calls[0].integrityPolicy.preserve.includes('logo'));
});

test('local media executor never claims execution without an executor', async () => {
  const executor = createLocalMediaExecutor();
  const result = await executor.run({ sourceImageUrl:'https://example.com/product.jpg', needsBackgroundRemoval:true });
  assert.equal(result.status,'LOCAL_CAPABILITY_UNAVAILABLE');
  assert.equal(result.publishable,false);
});
