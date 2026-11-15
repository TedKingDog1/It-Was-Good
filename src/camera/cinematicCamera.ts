import * as THREE from 'three';

export interface CameraKeyframe {
  /** Absolute project time in seconds. */
  time: number;
  /** Camera world position. */
  position: readonly [number, number, number];
  /** World-space point the camera looks toward. */
  target: readonly [number, number, number];
}

/**
 * Smooth, deterministic camera movement.
 *
 * Position and look direction use time-aware cubic Hermite interpolation.
 * Because the pose is calculated from absolute project time, seeking and
 * replaying always produce the same camera position.
 */
export class CinematicCameraRig {
  private readonly position = new THREE.Vector3();
  private readonly target = new THREE.Vector3();

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly keyframes: readonly CameraKeyframe[],
  ) {
    if (keyframes.length < 2) {
      throw new Error('A cinematic camera path requires at least two keyframes.');
    }

    for (let index = 0; index < keyframes.length; index += 1) {
      const frame = keyframes[index];

      if (!Number.isFinite(frame.time)) {
        throw new Error('Camera keyframe times must be finite numbers.');
      }

      if (index > 0 && frame.time <= keyframes[index - 1].time) {
        throw new Error('Camera keyframes must be in strictly increasing time order.');
      }
    }
  }

  update(projectTime: number): void {
    const first = this.keyframes[0];
    const last = this.keyframes[this.keyframes.length - 1];
    const time = THREE.MathUtils.clamp(projectTime, first.time, last.time);

    let segment = 0;
    while (
      segment < this.keyframes.length - 2 &&
      time > this.keyframes[segment + 1].time
    ) {
      segment += 1;
    }

    const a = this.keyframes[segment];
    const b = this.keyframes[segment + 1];
    const previous = this.keyframes[Math.max(0, segment - 1)];
    const next = this.keyframes[Math.min(this.keyframes.length - 1, segment + 2)];
    const duration = b.time - a.time;
    const amount = THREE.MathUtils.clamp((time - a.time) / duration, 0, 1);

    this.sampleVector(
      this.position,
      previous.position,
      a.position,
      b.position,
      next.position,
      previous.time,
      a.time,
      b.time,
      next.time,
      duration,
      amount,
    );

    this.sampleVector(
      this.target,
      previous.target,
      a.target,
      b.target,
      next.target,
      previous.time,
      a.time,
      b.time,
      next.time,
      duration,
      amount,
    );

    this.camera.position.copy(this.position);
    this.camera.lookAt(this.target);
  }

  private sampleVector(
    output: THREE.Vector3,
    previous: readonly [number, number, number],
    start: readonly [number, number, number],
    end: readonly [number, number, number],
    next: readonly [number, number, number],
    previousTime: number,
    startTime: number,
    endTime: number,
    nextTime: number,
    duration: number,
    amount: number,
  ): void {
    const p0 = new THREE.Vector3(...previous);
    const p1 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const p3 = new THREE.Vector3(...next);

    const tangentStart = segment === 0
      ? new THREE.Vector3().subVectors(p2, p1).divideScalar(duration)
      : new THREE.Vector3().subVectors(p2, p0).divideScalar(endTime - previousTime);

    const tangentEnd = nextTime === endTime
      ? new THREE.Vector3().subVectors(p2, p1).divideScalar(duration)
      : new THREE.Vector3().subVectors(p3, p1).divideScalar(nextTime - startTime);

    const t2 = amount * amount;
    const t3 = t2 * amount;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + amount;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    output
      .copy(p1)
      .multiplyScalar(h00)
      .addScaledVector(tangentStart, h10 * duration)
      .addScaledVector(p2, h01)
      .addScaledVector(tangentEnd, h11 * duration);
  }
}
