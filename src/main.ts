import './style.css';
import * as THREE from 'three';
import { createVoidEnvironment } from './environments/void';
import { MasterTimeline, PROJECT_DURATION_SECONDS } from './masterTimeline';

const container = document.getElementById('scene');
const playPauseButton = document.getElementById('play-pause') as HTMLButtonElement | null;
const restartButton = document.getElementById('restart-scene') as HTMLButtonElement | null;
const timelineSlider = document.getElementById('timeline-slider') as HTMLInputElement | null;
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');
const status = document.getElementById('status');
const player = document.getElementById('suno-player');

if (!container || !playPauseButton || !restartButton || !timelineSlider ||
    !currentTimeDisplay || !totalTimeDisplay || !status) {
  throw new Error('One or more visualizer controls could not be found in index.html.');
}

const timeline = new MasterTimeline();
const VOID_PREVIEW_DURATION = 30;

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

totalTimeDisplay.textContent = formatTime(PROJECT_DURATION_SECONDS);

function updateTimelineControls(time: number): void {
  currentTimeDisplay.textContent = formatTime(time);

  if (document.activeElement !== timelineSlider) {
    timelineSlider.value = String(time);
  }

  if (timeline.isPlaying()) {
    playPauseButton.textContent = 'Pause';
  } else if (time >= PROJECT_DURATION_SECONDS) {
    playPauseButton.textContent = 'Replay';
  } else if (time > 0) {
    playPauseButton.textContent = 'Resume';
  } else {
    playPauseButton.textContent = 'Play visuals';
  }

  if (time <= VOID_PREVIEW_DURATION) {
    status.textContent = timeline.isPlaying()
      ? 'Opening sequence: the void. The visual timeline is running.'
      : 'Opening sequence: the void. Press Play visuals to begin.';
  } else {
    status.textContent = 'You are beyond the current void preview. The timeline controls are working; the later creation environments have not been built yet.';
  }

  if (time >= PROJECT_DURATION_SECONDS && !timeline.isPlaying()) {
    status.textContent = 'The 7:24 timeline has reached the end. Press Replay or move the slider to review it.';
  }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  65,
  Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
  0.1,
  200
);
camera.position.set(0, 0, 24);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const voidEnvironment = createVoidEnvironment(scene);

function animate(): void {
  requestAnimationFrame(animate);

  const currentTime = timeline.getCurrentTime();
  // The void is the only completed environment so far. Hold its final
  // frame after 0:30 until the next creation environment is implemented.
  voidEnvironment.update(Math.min(currentTime, VOID_PREVIEW_DURATION), camera);
  renderer.render(scene, camera);
  updateTimelineControls(currentTime);
}

timeline.seek(0);
voidEnvironment.update(0, camera);
renderer.render(scene, camera);
updateTimelineControls(0);
animate();

playPauseButton.addEventListener('click', () => {
  if (timeline.isPlaying()) {
    timeline.pause();
  } else {
    timeline.play();
  }
  updateTimelineControls(timeline.getCurrentTime());
});

restartButton.addEventListener('click', () => {
  timeline.restart();
  updateTimelineControls(0);
});

timelineSlider.addEventListener('input', () => {
  timeline.seek(Number(timelineSlider.value));
  updateTimelineControls(timeline.getCurrentTime());
});

// The iframe load event only confirms that the embedded page loaded.
// It cannot expose playback position or play/pause state across origins.
if (player) {
  player.addEventListener('load', () => {
    if (!timeline.isPlaying() && timeline.getCurrentTime() === 0) {
      status.textContent = 'Suno player loaded. Press Play on the soundtrack, then Play visuals.';
    }
  });
}

window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width <= 0 || height <= 0) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
