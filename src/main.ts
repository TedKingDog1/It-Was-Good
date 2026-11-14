
import './style.css';
import * as THREE from 'three';
import { createVoidEnvironment } from './environments/void';

// --------------------------------------------------
// SCENE
// --------------------------------------------------

const container = document.getElementById('scene');
const startButton = document.getElementById('start-scene') as HTMLButtonElement | null;
const status = document.getElementById('status');
const player = document.getElementById('suno-player');

if (!container || !startButton) {
  throw new Error('Scene container or Start Scene button not found.');
}

const scene = new THREE.Scene();

// --------------------------------------------------
// CAMERA
// --------------------------------------------------

const camera = new THREE.PerspectiveCamera(
  65,
  container.clientWidth / container.clientHeight,
  0.1,
  200
);

camera.position.set(0, 0, 24);

// --------------------------------------------------
// RENDERER
// --------------------------------------------------

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

container.appendChild(renderer.domElement);

// --------------------------------------------------
// ENVIRONMENT
// --------------------------------------------------

const voidEnvironment = createVoidEnvironment(scene);

// Display the initial, frozen scene
voidEnvironment.update(0, camera);
renderer.render(scene, camera);

// --------------------------------------------------
// MASTER CLOCK
// --------------------------------------------------

const clock = new THREE.Clock();
let started = false;

function animate() {
  if (!started) return;

  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  voidEnvironment.update(elapsedTime, camera);

  renderer.render(scene, camera);
}

// --------------------------------------------------
// START BUTTON
// --------------------------------------------------

startButton.addEventListener('click', () => {
  if (started) return;

  started = true;

  // Start the clock at zero
  clock.start();

  startButton.disabled = true;
  startButton.textContent = 'Scene Running';

  if (status) {
    status.textContent = 'The creation sequence has begun.';
  }

  animate();
});

// --------------------------------------------------
// SUNO PLAYER STATUS
// --------------------------------------------------

if (player && status) {
  player.addEventListener('load', () => {
    if (!started) {
      status.textContent = 'Player ready. Press Play, then Start Scene.';
    }
  });
}

// --------------------------------------------------
// WINDOW RESIZING
// --------------------------------------------------

window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (width === 0 || height === 0) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});
