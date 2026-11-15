import * as THREE from 'three';

const vertexShader = `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPosition.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  uniform float uIntensity;
  uniform vec3 uWarmColor;
  uniform vec3 uCoreColor;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDirection = normalize(-vViewPosition);
    float facing = max(dot(normalize(vViewNormal), viewDirection), 0.0);
    float softBody = pow(facing, 0.42);
    float brightCore = pow(facing, 2.2);
    float alpha = softBody * uIntensity;
    vec3 color = mix(uWarmColor, uCoreColor, brightCore);
    gl_FragColor = vec4(color * alpha * 2.4, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * A luminous, vertically elongated presence. Its ellipsoid surface is
 * deliberately hidden by a view-facing glow gradient rather than an outline.
 */
export function createLuminousPresence(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(0, 2.7, -51);

  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uIntensity: { value: 0 },
      uWarmColor: { value: new THREE.Color(0xffc66e) },
      uCoreColor: { value: new THREE.Color(0xfff8e8) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const core = new THREE.Mesh(geometry, material);
  core.scale.set(0.82, 2.46, 0.62);
  group.add(core);

  const haloGeometry = new THREE.SphereGeometry(1, 40, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc66e,
    transparent: true,
    opacity: 0.055,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.scale.set(1.45, 4.35, 1.1);
  group.add(halo);

  const light = new THREE.PointLight(0xffd69a, 0, 34, 1.8);
  group.add(light);
  scene.add(group);

  const position = new THREE.Vector3();

  function update(projectTime: number): void {
    const appear = THREE.MathUtils.smoothstep(projectTime, 43.5, 47);
    const disappear = 1 - THREE.MathUtils.smoothstep(projectTime, 54.5, 56);
    const visibility = appear * disappear;
    const travel = THREE.MathUtils.smoothstep(projectTime, 47, 53.5);
    const pulse = 0.5 + 0.5 * Math.sin(projectTime * 1.15);
    const breathing = 1 + Math.sin(projectTime * 1.15) * 0.035;

    position.set(
      THREE.MathUtils.lerp(-2.8, 3.4, travel),
      2.7 + Math.sin(projectTime * 0.55) * 0.16,
      THREE.MathUtils.lerp(-51, -69, travel),
    );
    group.position.copy(position);
    group.scale.setScalar(breathing);
    material.uniforms.uIntensity.value = visibility * (0.68 + pulse * 0.32);
    haloMaterial.opacity = visibility * (0.035 + pulse * 0.025);
    light.intensity = visibility * (5.5 + pulse * 2.0);
  }

  return {
    position,
    update,
    get intensity(): number {
      return material.uniforms.uIntensity.value;
    },
    dispose(): void {
      scene.remove(group);
      geometry.dispose();
      material.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
    },
  };
}
