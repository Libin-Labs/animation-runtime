export interface Keyframe {
  at: number;
  value: number;
}

export interface AnimationTrack {
  name: string;
  keyframes: readonly Keyframe[];
}

export interface AnimationDefinition {
  durationMs: number;
  tracks: readonly AnimationTrack[];
}

export interface AnimationSample {
  time: number;
  values: Readonly<Record<string, number>>;
  complete: boolean;
  cancelled: boolean;
}

export interface Animation {
  readonly durationMs: number;
  sample(time: number): AnimationSample;
  cancel(time: number): AnimationSample;
}

function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
  return value;
}

function interpolate(track: AnimationTrack, time: number): number {
  const frames = track.keyframes;
  if (time <= frames[0]!.at) return frames[0]!.value;
  for (let index = 1; index < frames.length; index += 1) {
    const right = frames[index]!;
    if (time <= right.at) {
      const left = frames[index - 1]!;
      const progress = (time - left.at) / (right.at - left.at);
      return left.value + (right.value - left.value) * progress;
    }
  }
  return frames[frames.length - 1]!.value;
}

export function createAnimation(definition: AnimationDefinition): Animation {
  if (!definition || typeof definition !== 'object' || !Array.isArray(definition.tracks)) {
    throw new TypeError('An animation definition with a tracks array is required.');
  }
  const durationMs = finite(definition.durationMs, 'durationMs');
  if (durationMs <= 0 || durationMs > 86_400_000) {
    throw new RangeError('durationMs must be greater than 0 and no greater than one day.');
  }
  if (definition.tracks.length > 1000) throw new RangeError('At most 1000 tracks are supported.');
  const names = new Set<string>();
  const sourceTracks = definition.tracks as readonly AnimationTrack[];
  const tracks = sourceTracks.map((track) => {
    if (!track || typeof track.name !== 'string' || !/^[A-Za-z_][\w.-]{0,63}$/.test(track.name)) {
      throw new TypeError('Track names must be unique identifiers of at most 64 characters.');
    }
    if (names.has(track.name)) throw new TypeError(`Duplicate track name: ${track.name}`);
    names.add(track.name);
    if (
      !Array.isArray(track.keyframes) ||
      track.keyframes.length < 1 ||
      track.keyframes.length > 1000
    ) {
      throw new RangeError(`Track "${track.name}" must have 1 to 1000 keyframes.`);
    }
    let previous = -1;
    const keyframes = (track.keyframes as readonly Keyframe[]).map((frame) => {
      const at = finite(frame.at, 'keyframe.at');
      const value = finite(frame.value, 'keyframe.value');
      if (at < 0 || at > durationMs || at <= previous) {
        throw new RangeError(
          'Keyframe times must increase strictly within the animation duration.',
        );
      }
      previous = at;
      return { at, value };
    });
    return { name: track.name, keyframes };
  });
  let cancelledSample: AnimationSample | undefined;
  const sample = (requestedTime: number): AnimationSample => {
    const time = finite(requestedTime, 'time');
    if (time < 0) throw new RangeError('time must be non-negative.');
    if (cancelledSample) return { ...cancelledSample, values: { ...cancelledSample.values } };
    const boundedTime = Math.min(time, durationMs);
    const values: Record<string, number> = Object.create(null) as Record<string, number>;
    for (const track of tracks) values[track.name] = interpolate(track, boundedTime);
    return { time: boundedTime, values, complete: boundedTime === durationMs, cancelled: false };
  };
  return {
    durationMs,
    sample,
    cancel(time) {
      if (cancelledSample) return { ...cancelledSample, values: { ...cancelledSample.values } };
      const point = finite(time, 'time');
      if (point < 0) throw new RangeError('time must be non-negative.');
      const result = sample(Math.min(point, durationMs));
      cancelledSample = { ...result, complete: false, cancelled: true };
      return { ...cancelledSample, values: { ...cancelledSample.values } };
    },
  };
}
