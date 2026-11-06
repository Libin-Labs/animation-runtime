import animation = require('@lp-labs/animation-runtime');
const time: number = animation.createAnimation({ durationMs: 1, tracks: [] }).sample(0).time;
void time;
