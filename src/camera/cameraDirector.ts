import * as THREE from 'three';

export interface CameraTakeSample {
  projectTime: number;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  target: [number, number, number];
}

export interface CameraTake {
  format: 'and-it-was-good-camera-take';
  version: 1;
  createdAt: string;
  samples: CameraTakeSample[];
  cameraPath: Array<{ time: number; position: [number, number, number]; target: [number, number, number] }>;
}

/**
 * Manual fly-camera controls and timestamped take recorder.
 * Click the preview to capture the mouse, then use WASD, Q/E, and Shift.
 */
export class CameraDirector {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;
  private readonly getProjectTime: () => number;
  private readonly keys = new Set<string>();
  private enabled = false;
  private recording = false;
  private lastSampleTime = -Infinity;
  private samples: CameraTakeSample[] = [];
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private readonly sensitivity = 0.0022;

  constructor(
    camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement,
    getProjectTime: () => number,
  ) {
    this.camera = camera;
    this.canvas = canvas;
    this.getProjectTime = getProjectTime;
    this.camera.rotation.order = 'YXZ';
    this.yaw = this.camera.rotation.y;
    this.pitch = this.camera.rotation.x;

    this.canvas.addEventListener('click', this.requestPointerLock);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearKeys);
  }

  private requestPointerLock = (): void => {
    if (this.enabled && document.pointerLockElement !== this.canvas) {
      void this.canvas.requestPointerLock();
    }
  };

  private onPointerLockChange = (): void => {
    if (document.pointerLockElement !== this.canvas) this.clearKeys();
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || document.pointerLockElement !== this.canvas) return;
    this.yaw -= event.movementX * this.sensitivity;
    this.pitch -= event.movementY * this.sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.48, 1.48);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || document.pointerLockElement !== this.canvas) return;
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'q', 'e', 'shift'].includes(key)) {
      event.preventDefault();
      this.keys.add(key);
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.key.toLowerCase());
  };

  private clearKeys = (): void => {
    this.keys.clear();
  };

  enable(): void {
    this.enabled = true;
    this.yaw = this.camera.rotation.y;
    this.pitch = this.camera.rotation.x;
    this.canvas.focus();
  }

  disable(): void {
    this.enabled = false;
    this.stopRecording();
    this.clearKeys();
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isRecording(): boolean {
    return this.recording;
  }

  startRecording(): void {
    this.samples = [];
    this.recording = true;
    this.lastSampleTime = -Infinity;
    this.captureSample();
  }

  stopRecording(): CameraTake {
    if (this.recording) this.captureSample();
    this.recording = false;
    return this.getTake();
  }

  getTake(): CameraTake {
    return {
      format: 'and-it-was-good-camera-take',
      version: 1,
      createdAt: new Date().toISOString(),
      samples: this.samples.map(sample => ({
        projectTime: sample.projectTime,
        position: [sample.position[0], sample.position[1], sample.position[2]] as [number, number, number],
        quaternion: [sample.quaternion[0], sample.quaternion[1], sample.quaternion[2], sample.quaternion[3]] as [number, number, number, number],
        target: [sample.target[0], sample.target[1], sample.target[2]] as [number, number, number],
      })),
      cameraPath: this.samples.map(sample => ({
        time: sample.projectTime,
        position: [sample.position[0], sample.position[1], sample.position[2]] as [number, number, number],
        target: [sample.target[0], sample.target[1], sample.target[2]] as [number, number, number],
      })),
    };
  }

  downloadTake(): void {
    const take = this.getTake();
    const blob = new Blob([JSON.stringify(take, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'and-it-was-good-camera-take.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  update(deltaSeconds: number): void {
    if (!this.enabled) return;

    const speed = this.keys.has('shift') ? 24 : 7;
    this.camera.getWorldDirection(this.forward);
    this.right.crossVectors(this.forward, this.camera.up).normalize();
    this.movement.set(0, 0, 0);

    if (this.keys.has('w')) this.movement.add(this.forward);
    if (this.keys.has('s')) this.movement.sub(this.forward);
    if (this.keys.has('d')) this.movement.add(this.right);
    if (this.keys.has('a')) this.movement.sub(this.right);
    if (this.keys.has('e')) this.movement.y += 1;
    if (this.keys.has('q')) this.movement.y -= 1;

    if (this.movement.lengthSq() > 0) {
      this.movement.normalize().multiplyScalar(speed * Math.max(0, deltaSeconds));
      this.camera.position.add(this.movement);
    }

    if (this.recording) {
      const projectTime = this.getProjectTime();
      if (projectTime - this.lastSampleTime >= 0.1) this.captureSample();
    }
  }

  private captureSample(): void {
    this.camera.getWorldDirection(this.direction);
    this.target.copy(this.camera.position).addScaledVector(this.direction, 12);
    this.samples.push({
      projectTime: this.getProjectTime(),
      position: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
      quaternion: [
        this.camera.quaternion.x,
        this.camera.quaternion.y,
        this.camera.quaternion.z,
        this.camera.quaternion.w,
      ],
      target: [this.target.x, this.target.y, this.target.z],
    });
    this.lastSampleTime = this.getProjectTime();
  }

  dispose(): void {
    this.disable();
    this.canvas.removeEventListener('click', this.requestPointerLock);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearKeys);
  }
}
