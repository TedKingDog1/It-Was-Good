import type { CameraKeyframe } from './cinematicCamera';

/**
 * Opening sequence: a continuous journey from the darkness to the
 * primordial ocean. Times are absolute project timestamps.
 */
export const OPENING_CAMERA_PATH: readonly CameraKeyframe[] = [
  { time: 0, position: [0, 0, 24], target: [0, 0, 14] },
  { time: 7, position: [-0.3, 0.08, 15.6], target: [-0.15, 0.02, 5] },
  { time: 14, position: [0.15, 0.35, 7.2], target: [0.1, 0.05, -7] },
  { time: 21, position: [0.85, 1.5, -1.2], target: [0.4, -0.8, -25] },
  { time: 27, position: [0.55, 1.35, -8.4], target: [0.2, -1.15, -37] },
  { time: 30, position: [0.48, 1.3, -12], target: [0.35, -1.15, -43] },
  { time: 35, position: [-0.8, 0.95, -15.1], target: [-1.2, -1.15, -48] },
  { time: 41, position: [-1.8, 0.8, -18.8], target: [1.8, -1.15, -61] },
  { time: 46, position: [0.2, 1.05, -21.9], target: [0.4, -1.1, -53] },
  { time: 51, position: [1.7, 2.0, -25.6], target: [0.7, -0.9, -70] },
  { time: 55, position: [0.4, 2.8, -30], target: [0, -0.65, -83] },
];
