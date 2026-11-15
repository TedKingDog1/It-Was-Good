
import * as THREE from 'three';

export function createVoidEnvironment(scene: THREE.Scene) {
  // Background
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.006);

  // Main light source
  const lightGeometry = new THREE.IcosahedronGeometry(1, 2);

  const lightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd98a,
  });

  const lightSphere = new THREE.Mesh(
    lightGeometry,
    lightMaterial
  );

  lightSphere.position.set(0, 0, -10);
  scene.add(lightSphere);

  // Outer glow
  const glowGeometry = new THREE.SphereGeometry(1.8, 24, 16);

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffa83d,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.copy(lightSphere.position);
  scene.add(glow);

  // Actual illumination
  const pointLight = new THREE.PointLight(
    0xffd18a,
    0,
    90,
    1.5
  );

  pointLight.position.copy(lightSphere.position);
  scene.add(pointLight);

  // Subtle particles in the darkness
  const particleCount = 500;
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Deterministic particle placement
    const seed = i * 127.1;

    const randomX = Math.abs(Math.sin(seed) * 43758.5453) % 1;
    const randomY = Math.abs(Math.sin(seed + 17) * 43758.5453) % 1;
    const randomZ = Math.abs(Math.sin(seed + 39) * 43758.5453) % 1;

    particlePositions[i3] = (randomX - 0.5) * 65;
    particlePositions[i3 + 1] = (randomY - 0.5) * 40;
    particlePositions[i3 + 2] = 15 - randomZ * 90;
  }

  const particleGeometry = new THREE.BufferGeometry();

  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xc6bba4,
    size: 0.045,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(
    particleGeometry,
    particleMaterial
  );

  scene.add(particles);

  // Environment update
  function update(time: number, camera: THREE.PerspectiveCamera) {
    // Camera travels forward through the environment
    camera.position.set(
      Math.sin(time * 0.045) * 0.5,
      Math.sin(time * 0.07) * 0.25,
      24 - time * 1.2
    );

    // Keep the camera looking forward
    camera.lookAt(
      camera.position.x,
      camera.position.y,
      camera.position.z - 10
    );

    // Light gradually awakens
    const lightProgress = THREE.MathUtils.smoothstep(
      time,
      2,
      25
    );

    pointLight.intensity = lightProgress * 35;

    // The source gradually becomes more prominent
    const sphereScale = 0.15 + lightProgress * 0.85;

    lightSphere.scale.setScalar(sphereScale);

    // Glow expands with the light
    const glowScale = 0.5 + lightProgress * 2.5;

    glow.scale.setScalar(glowScale);
    glowMaterial.opacity = 0.04 + lightProgress * 0.16;

    // Gentle particle movement
    particles.position.z = (time * 0.15) % 15;
  }

  return {
    update,
    setVisible(visible: boolean) {
      lightSphere.visible = visible;
      glow.visible = visible;
      pointLight.visible = visible;
      particles.visible = visible;
    },
    dispose() {
      scene.remove(lightSphere);
      scene.remove(glow);
      scene.remove(pointLight);
      scene.remove(particles);

      lightGeometry.dispose();
      lightMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    },
  };
}
