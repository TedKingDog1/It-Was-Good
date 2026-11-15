import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying float vWaveHeight;

  float waveHeight(vec2 p, float t) {
    float h = sin(p.x * 0.055 + t * 0.38) * 0.34;
    h += sin(p.y * 0.040 - t * 0.23 + p.x * 0.018) * 0.48;
    h += sin(p.y * 0.090 + p.x * 0.025 + t * 0.31) * 0.15;
    h += sin((p.x + p.y) * 0.13 - t * 0.48) * 0.055;
    return h;
  }

  void main() {
    vec3 displaced = position;
    float height = waveHeight(position.xy, uTime);
    displaced.z += height;

    vWaveHeight = height;
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uReveal;
  uniform vec3 uCameraPosition;

  varying vec3 vWorldPosition;
  varying float vWaveHeight;

  void main() {
    vec3 deepWater = vec3(0.004, 0.012, 0.026);
    vec3 blueWater = vec3(0.012, 0.045, 0.078);
    vec3 waveColor = vec3(0.045, 0.105, 0.145);

    float broadWave = sin(vWorldPosition.x * 0.045 + vWorldPosition.z * 0.025 + uTime * 0.35);
    float fineWave = sin(vWorldPosition.x * 0.19 - vWorldPosition.z * 0.11 + uTime * 0.72);
    float crest = smoothstep(0.18, 0.72, vWaveHeight + broadWave * 0.16);
    float glint = pow(max(0.0, broadWave * 0.5 + fineWave * 0.22 + 0.28), 10.0);

    vec3 color = mix(deepWater, blueWater, 0.30 + crest * 0.42);
    color = mix(color, waveColor, crest * 0.20);
    color += vec3(0.045, 0.075, 0.095) * glint * 0.34;

    float distanceToCamera = distance(vWorldPosition, uCameraPosition);
    float atmosphericFade = smoothstep(65.0, 235.0, distanceToCamera);
    vec3 horizonColor = vec3(0.003, 0.007, 0.014);
    color = mix(color, horizonColor, atmosphericFade);

    gl_FragColor = vec4(color, uReveal);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * A broad, shader-driven primordial ocean.
 * Its waves are calculated from absolute time, so timeline seeking is deterministic.
 */
export function createPrimordialOcean(scene: THREE.Scene) {
  const previousBackground = scene.background;
  const previousFog = scene.fog;

  scene.background = new THREE.Color(0x02050a);
  scene.fog = new THREE.FogExp2(0x02050a, 0.004);

  const geometry = new THREE.PlaneGeometry(700, 700, 220, 220);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const ocean = new THREE.Mesh(geometry, material);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -1.2, -180);
  ocean.frustumCulled = false;
  scene.add(ocean);

  const cameraTarget = new THREE.Vector3();

  function update(
    elapsedSeconds: number,
    camera: THREE.PerspectiveCamera,
    reveal: number,
  ): void {
    const time = Math.max(0, elapsedSeconds);
    const fade = THREE.MathUtils.clamp(reveal, 0, 1);

    material.uniforms.uTime.value = time;
    material.uniforms.uReveal.value = fade;

    // Keep the camera close to the water, then gradually lift it toward the horizon.
    camera.position.set(
      Math.sin(time * 0.035) * 0.45,
      0.35 + THREE.MathUtils.smoothstep(time, 0, 30) * 0.65,
      -time * 0.62,
    );

    cameraTarget.set(
      camera.position.x + Math.sin(time * 0.025) * 0.8,
      -0.95,
      camera.position.z - 42,
    );
    camera.lookAt(cameraTarget);

    material.uniforms.uCameraPosition.value.copy(camera.position);
  }

  return {
    update,
    dispose(): void {
      scene.remove(ocean);
      geometry.dispose();
      material.dispose();
      scene.background = previousBackground;
      scene.fog = previousFog;
    },
  };
}
