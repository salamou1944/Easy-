const IMAGE_PLACEMENTS = Object.freeze([
  { id: 'feed_portrait', width: 1080, height: 1350, ratio: '4:5' },
  { id: 'feed_square', width: 1080, height: 1080, ratio: '1:1' },
  { id: 'story_reels', width: 1080, height: 1920, ratio: '9:16' }
]);

const VIDEO_PLACEMENTS = Object.freeze([
  { id: 'reels', width: 1080, height: 1920, ratio: '9:16', requiresSafeZone: true },
  { id: 'feed_video', width: 1080, height: 1350, ratio: '4:5', requiresSafeZone: false }
]);

export function buildMetaReadiness({ images = [], videos = [], copy = {}, integrity = [], policy = {} } = {}) {
  const failures = [];
  const imageChecks = IMAGE_PLACEMENTS.map(spec => {
    const artifact = images.find(x => x?.placementId === spec.id);
    const ok = Boolean(artifact?.url && artifact?.width === spec.width && artifact?.height === spec.height);
    if (!ok) failures.push('image:' + spec.id);
    return { ...spec, ok };
  });

  const videoChecks = VIDEO_PLACEMENTS.map(spec => {
    const artifact = videos.find(x => x?.placementId === spec.id);
    const ok = Boolean(
      artifact?.url &&
      artifact?.width === spec.width &&
      artifact?.height === spec.height &&
      (!spec.requiresSafeZone || artifact?.safeZoneVerified === true)
    );
    if (!ok) failures.push('video:' + spec.id);
    return { ...spec, ok };
  });

  const copyOk = Array.isArray(copy.primaryText) && copy.primaryText.length > 0 &&
    Array.isArray(copy.headlines) && copy.headlines.length > 0 &&
    Array.isArray(copy.ctas) && copy.ctas.length > 0;
  if (!copyOk) failures.push('copy');

  const integrityOk = Array.isArray(integrity) && integrity.length > 0 &&
    integrity.every(x => x?.passed === true && x?.publishable === true);
  if (!integrityOk) failures.push('integrity');

  if (policy.blocked === true) failures.push('policy_blocked');

  return {
    publishable: failures.length === 0,
    failures,
    imageChecks,
    videoChecks,
    copyOk,
    integrityOk,
    source: 'EASY Meta readiness gate'
  };
}

export { IMAGE_PLACEMENTS, VIDEO_PLACEMENTS };
