import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnimation } from '../dist/esm/index.js';

const definition = {
  durationMs: 1000,
  tracks: [
    {
      name: 'x',
      keyframes: [
        { at: 0, value: 0 },
        { at: 500, value: 10 },
        { at: 1000, value: 20 },
      ],
    },
  ],
};

test('samples deterministic piecewise linear interpolation and endpoints', () => {
  const animation = createAnimation(definition);
  assert.equal(animation.sample(250).values.x, 5);
  assert.equal(animation.sample(750).values.x, 15);
  assert.equal(animation.sample(2000).values.x, 20);
  assert.equal(animation.sample(2000).complete, true);
  assert.equal(animation.sample(0).values.x, 0);
});

test('holds the nearest endpoint when tracks do not span the duration', () => {
  const animation = createAnimation({
    durationMs: 100,
    tracks: [
      {
        name: 'y',
        keyframes: [
          { at: 20, value: 3 },
          { at: 40, value: 7 },
        ],
      },
    ],
  });
  assert.equal(animation.sample(0).values.y, 3);
  assert.equal(animation.sample(80).values.y, 7);
});

test('cancellation freezes explicit samples and is idempotent', () => {
  const animation = createAnimation(definition);
  assert.equal(animation.cancel(250).values.x, 5);
  assert.deepEqual(animation.sample(900), {
    time: 250,
    values: { x: 5 },
    complete: false,
    cancelled: true,
  });
  assert.equal(animation.cancel(800).time, 250);
});

test('rejects malformed timeline definitions and sample times', () => {
  assert.throws(() => createAnimation({ durationMs: 0, tracks: [] }), RangeError);
  assert.throws(
    () =>
      createAnimation({
        durationMs: 100,
        tracks: [
          {
            name: 'x',
            keyframes: [
              { at: 20, value: 1 },
              { at: 20, value: 2 },
            ],
          },
        ],
      }),
    RangeError,
  );
  assert.throws(
    () =>
      createAnimation({
        durationMs: 1000,
        tracks: [definition.tracks[0], definition.tracks[0]],
      }),
    TypeError,
  );
  assert.throws(() => createAnimation(definition).sample(-1), RangeError);
});
