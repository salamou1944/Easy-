import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMetaReadiness } from '../src/meta-readiness-gate.mjs';

test('Meta readiness remains blocked when required placement assets are absent', () => {
  const result = buildMetaReadiness();
  assert.equal(result.publishable, false);
  assert.ok(result.failures.includes('image:feed_portrait'));
  assert.ok(result.failures.includes('video:reels'));
  assert.ok(result.failures.includes('copy'));
  assert.ok(result.failures.includes('integrity'));
});

test('Meta readiness requires the Reels safe-zone proof', () => {
  const base = {
    images: [
      { placementId:'feed_portrait', width:1080, height:1350, url:'https://x/portrait.jpg' },
      { placementId:'feed_square', width:1080, height:1080, url:'https://x/square.jpg' },
      { placementId:'story_reels', width:1080, height:1920, url:'https://x/story.jpg' }
    ],
    videos: [
      { placementId:'reels', width:1080, height:1920, url:'https://x/reels.mp4', safeZoneVerified:false },
      { placementId:'feed_video', width:1080, height:1350, url:'https://x/feed.mp4' }
    ],
    copy:{primaryText:['a'],headlines:['b'],ctas:['Learn More']},
    integrity:[{passed:true,publishable:true}]
  };
  const blocked=buildMetaReadiness(base);
  assert.equal(blocked.publishable,false);
  assert.ok(blocked.failures.includes('video:reels'));
  base.videos[0].safeZoneVerified=true;
  const ready=buildMetaReadiness(base);
  assert.equal(ready.publishable,true);
});
