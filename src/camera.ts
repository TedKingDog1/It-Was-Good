
import * as THREE from 'three';

interface CameraKeyframe {
  time: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
  cutBefore?: boolean;
}

const keyframes: CameraKeyframe[] = [
  {
    time: 0,
    position: new THREE.Vector3(0, 0, 16),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    time: 5,
    position: new THREE.Vector3(-7, 2, 12),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    time: 10,
    position: new THREE.Vector3(7, 5, 9),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    time: 15,
    position: new THREE.Vector3(0, 12, 5),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    time: 20,
    position: new THREE.Vector3(0, -5, 11),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    time: 25,
    position: new THREE.Vector3(-12, 3, 7),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    time: 30,
    position: new THREE.Vector3(12, 2, 7),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    time: 35,
    position: new THREE.Vector3(0, 0, 20),
    target: new THREE.Vector3(0, 0, 0)
  }
];

export function updateCamera(
  camera: THREE.PerspectiveCamera,
  time: number
) {
  let index = 0;

  while (
    index < keyframes.length - 1 &&
    time >= keyframes[index + 1].time
  ) {
    index++;
  }

  const current = keyframes[index];
  const next = keyframes[Math.min(index + 1, keyframes.length - 1)];

  let position = current.position.clone();
  let target = current.target.clone();

  if (index < keyframes.length - 1 && !next.cutBefore) {
    const duration = next.time - current.time;

    const progress = THREE.MathUtils.clamp(
      (time - current.time) / duration,
      0,
      1
    );

    const eased = progress * progress * (3 - 2 * progress);

    position.lerp(next.position, eased);
    target.lerp(next.target, eased);
  }

  camera.position.copy(position);
  camera.lookAt(target);
}
