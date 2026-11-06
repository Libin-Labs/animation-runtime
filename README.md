# @lp-labs/animation-runtime

Describe and explicitly sample deterministic numeric timelines. The runtime has no timer, browser,
or rendering integration.

## Install and quick start

```sh
npm install @lp-labs/animation-runtime
```

```js
import { createAnimation } from '@lp-labs/animation-runtime';

const animation = createAnimation({
  durationMs: 1000,
  tracks: [
    {
      name: 'opacity',
      keyframes: [
        { at: 0, value: 0 },
        { at: 1000, value: 1 },
      ],
    },
  ],
});
console.log(animation.sample(250).values.opacity); // 0.25
```

## API

- `createAnimation(definition)` validates a finite positive duration and unique named numeric tracks.
  Each track contains strictly increasing keyframes within the duration.
- `animation.sample(time)` clamps a non-negative finite time to the duration and returns linearly
  interpolated values, with `complete` set at the endpoint.
- `animation.cancel(time)` samples the requested point and freezes all future samples there;
  repeated cancellation returns the same frozen sample.
- `AnimationDefinition`, `AnimationTrack`, `Keyframe`, `Animation`, and `AnimationSample` are
  exported types.

Tracks may begin after time zero or end before the duration; their first or last value is held
outside their keyframe span. Durations are at most one day, with at most 1,000 tracks and 1,000
keyframes per track. Invalid numeric values, duplicate names, or non-increasing/out-of-range
keyframes throw `TypeError` or `RangeError`.

## Limits and customization

Interpolation is linear only. Cancellation is an explicit state change on this animation object;
sampling does not advance clocks, invoke callbacks, schedule frames, access a browser, or guarantee
frame timing or rendering. Apply easing or adapt the sampled values in your own application. There
are no runtime or peer dependencies.

ESM, CommonJS, and TypeScript declarations are included. TypeScript and Prettier are development-only.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
