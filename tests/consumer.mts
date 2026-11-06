import { createAnimation, type AnimationSample } from '@lp-labs/animation-runtime';
const sample: AnimationSample = createAnimation({
  durationMs: 100,
  tracks: [{ name: 'x', keyframes: [{ at: 0, value: 1 }] }],
}).sample(50);
// @ts-expect-error keyframe values must be numeric.
createAnimation({ durationMs: 100, tracks: [{ name: 'x', keyframes: [{ at: 0, value: '1' }] }] });
void sample;
