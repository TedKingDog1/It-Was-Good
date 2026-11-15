import * as THREE from 'three';

/**
 * The opening void is intentionally almost empty.
 * There is no visible light orb: the frame is defined by darkness,
 * distance, and a sparse field of faint particles.
 */
export function createVoidEnvironment(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.006);

  const particleCount = 420;
  const particlePositions = new Float32Array(particleCount * 3);

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const seed = index * 127.1;

    const randomX = Math.abs(Math.sin(seed) * 43758.5453) % 1;
    const randomY = Math.abs(Math.sin(seed + 17) * 43758.5453) % 1;
    const randomZ = Math.abs(Math.sin(seed + 39) * 43758.5453) % 1;

    particlePositions[offset] = (randomX - 0.5) * 65;
    particlePositions[offset + 1] = (randomY - 0.5) * 38;
    particlePositions[offset + 2] = 15 - randomZ * 90;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(particlePositions, 3),
  );

  const material = new THREE.PointsMaterial({
    color: 0xc6c1b8,
    size: 0.035,
    transparent: true,
    opacity: 0.22,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  function update(time: number): void {
    const safeTime = Math.max(0, time);
    particles.position.z = (safeTime * 0.12) % 15;
    particles.position.x = Math.sin(safeTime * 0.025) * 0.18;
  }

  return {
    update,
    setVisible(visible: boolean): void {
      particles.visible = visible;
    },
    dispose(): void {
      scene.remove(particles);
      geometry.dispose();
      material.dispose();
    },
  };
}
