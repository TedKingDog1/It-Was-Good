import './style.css';
import * as THREE from 'three';
import { createVoidEnvironment } from './environments/void';
import { createPrimordialOcean } from './environments/primordialOcean';
import { createLuminousPresence } from './effects/luminousPresence';
import { CameraDirector } from './camera/cameraDirector';
import { CinematicCameraRig } from './camera/cinematicCamera';
import { OPENING_CAMERA_PATH } from './camera/openingCameraPath';
import { MasterTimeline, PROJECT_DURATION_SECONDS } from './masterTimeline';

const container = document.getElementById('scene');
const playPauseButton = document.getElementById('play-pause') as HTMLButtonElement | null;
const restartButton = document.getElementById('restart-scene') as HTMLButtonElement | null;
const timelineSlider = document.getElementById('timeline-slider') as HTMLInputElement | null;
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');
const status = document.getElementById('status');
const player = document.getElementById('suno-player');
const cameraModeButton = document.getElementById('camera-mode') as HTMLButtonElement | null;
const recordCameraButton = document.getElementById('record-camera') as HTMLButtonElement | null;
const stopCameraButton = document.getElementById('stop-camera') as HTMLButtonElement | null;
const saveCameraButton = document.getElementById('save-camera') as HTMLButtonElement | null;
const cameraStatus = document.getElementById('camera-status');

if (!container || !playPauseButton || !restartButton || !timelineSlider ||
    !currentTimeDisplay || !totalTimeDisplay || !status || !cameraModeButton ||
    !recordCameraButton || !stopCameraButton || !saveCameraButton || !cameraStatus) {
  throw new Error('One or more visualizer controls could not be found in index.html.');
}

const sceneContainer = container;
const playButton = playPauseButton;
const restartSceneButton = restartButton;
const slider = timelineSlider;
const currentTime = currentTimeDisplay;
const totalTime = totalTimeDisplay;
const statusMessage = status;
const cameraStatusMessage = cameraStatus;

const timeline = new MasterTimeline();
const VOID_END_SECONDS = 30;
const OCEAN_START_SECONDS = 30;
const OCEAN_END_SECONDS = 55;

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

totalTime.textContent = formatTime(PROJECT_DURATION_SECONDS);

function updateTimelineControls(time: number): void {
  currentTime.textContent = formatTime(time);

  if (document.activeElement !== slider) {
    slider.value = String(time);
  }

  if (timeline.isPlaying()) {
    playButton.textContent = 'Pause';
  } else if (time >= PROJECT_DURATION_SECONDS) {
    playButton.textContent = 'Replay';
  } else if (time > 0) {
    playButton.textContent = 'Resume';
  } else {
    playButton.textContent = 'Play visuals';
  }

  if (time <= VOID_END_SECONDS) {
    statusMessage.textContent = timeline.isPlaying()
      ? 'Opening sequence: the void. The visual timeline is running.'
      : 'Opening sequence: the void. Press Play visuals to begin.';
  } else if (time <= OCEAN_END_SECONDS) {
    statusMessage.textContent = 'Prologue: primordial waters. The camera is sweeping across the ocean.';
  } else {
    statusMessage.textContent = 'You are beyond the completed opening environments. Later creation scenes are still being built.';
  }

  if (time >= PROJECT_DURATION_SECONDS && !timeline.isPlaying()) {
    statusMessage.textContent = 'The 7:24 timeline has reached the end. Press Replay or move the slider to review it.';
  }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  65,
  Math.max(sceneContainer.clientWidth, 1) / Math.max(sceneContainer.clientHeight, 1),
  0.1,
  200,
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.domElement.tabIndex = 0;
sceneContainer.appendChild(renderer.domElement);

const voidEnvironment = createVoidEnvironment(scene);
const oceanEnvironment = createPrimordialOcean(scene);
const luminousPresence = createLuminousPresence(scene);
const cameraRig = new CinematicCameraRig(camera, OPENING_CAMERA_PATH);
const cameraDirector = new CameraDirector(camera, renderer.domElement, () => timeline.getCurrentTime());

scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.006);

let previousFrameTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  const deltaSeconds = Math.min(Math.max((now - previousFrameTime) / 1000, 0), 0.05);
  previousFrameTime = now;
  cameraDirector.update(deltaSeconds);

  const time = timeline.getCurrentTime();
  const openingTime = Math.min(time, OCEAN_END_SECONDS);

  // The authored path drives normal playback; manual direction takes control when enabled.
  if (!cameraDirector.isEnabled()) cameraRig.update(openingTime);
  luminousPresence.update(openingTime);

  if (openingTime < OCEAN_START_SECONDS) {
    voidEnvironment.setVisible(true);
    voidEnvironment.update(openingTime);
    oceanEnvironment.update(0, camera.position, 0, luminousPresence.position, 0);
  } else {
    voidEnvironment.setVisible(false);

    const oceanTime = openingTime - OCEAN_START_SECONDS;
    const reveal = THREE.MathUtils.smoothstep(oceanTime, 0, 8);
    oceanEnvironment.update(oceanTime, camera.position, reveal, luminousPresence.position, luminousPresence.intensity);
  }

  renderer.render(scene, camera);
  updateTimelineControls(time);
}

timeline.seek(0);
voidEnvironment.update(0);
luminousPresence.update(0);
oceanEnvironment.update(0, camera.position, 0, luminousPresence.position, 0);
cameraRig.update(0);
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.006);
renderer.render(scene, camera);
updateTimelineControls(0);
animate();

playButton.addEventListener('click', () => {
  if (timeline.isPlaying()) {
    timeline.pause();
  } else {
    timeline.play();
  }
  updateTimelineControls(timeline.getCurrentTime());
});

restartSceneButton.addEventListener('click', () => {
  timeline.restart();
  updateTimelineControls(0);
});

cameraModeButton.addEventListener('click', () => {
  if (cameraDirector.isEnabled()) {
    cameraDirector.disable();
    timeline.pause();
    cameraModeButton.textContent = 'Direct camera';
    recordCameraButton.disabled = true;
    stopCameraButton.disabled = true;
    cameraStatusMessage.textContent = 'Camera direction off. The authored camera path is active again.';
  } else {
    timeline.pause();
    cameraDirector.enable();
    cameraModeButton.textContent = 'Exit camera mode';
    recordCameraButton.disabled = false;
    cameraStatusMessage.textContent = 'Camera direction on. Click the scene to capture the mouse; press Escape to release it.';
  }
});

recordCameraButton.addEventListener('click', () => {
  if (!cameraDirector.isEnabled()) return;
  timeline.play();
  cameraDirector.startRecording();
  recordCameraButton.disabled = true;
  stopCameraButton.disabled = false;
  saveCameraButton.disabled = true;
  cameraStatusMessage.textContent = 'Recording camera movement against the project timeline…';
});

stopCameraButton.addEventListener('click', () => {
  const take = cameraDirector.stopRecording();
  timeline.pause();
  recordCameraButton.disabled = false;
  stopCameraButton.disabled = true;
  saveCameraButton.disabled = take.samples.length < 2;
  cameraStatusMessage.textContent = `Take captured: ${take.samples.length} samples. Save the camera log when you're happy with it.`;
});

saveCameraButton.addEventListener('click', () => {
  cameraDirector.downloadTake();
  cameraStatusMessage.textContent = 'Camera log exported with a ready-to-use cameraPath keyframe array.';
});

slider.addEventListener('input', () => {
  timeline.seek(Number(slider.value));
  updateTimelineControls(timeline.getCurrentTime());
});

// The iframe load event confirms only that the embed loaded.
// It cannot expose playback position or play/pause state across origins.
if (player) {
  player.addEventListener('load', () => {
    if (!timeline.isPlaying() && timeline.getCurrentTime() === 0) {
      statusMessage.textContent = 'Suno player loaded. Press Play on the soundtrack, then Play visuals.';
    }
  });
}

window.addEventListener('resize', () => {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;
  if (width <= 0 || height <= 0) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
