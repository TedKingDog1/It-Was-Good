
export interface SceneMarker {
  name: string;
  start: number;
}

export const scenes: SceneMarker[] = [
  { name: "Prologue — In the Beginning", start: 0 },
  { name: "Day 1 — Light", start: 30 },
  { name: "Day 2 — Sky and Waters", start: 60 },
  { name: "Day 3 — Land and Vegetation", start: 90 },
  { name: "Day 4 — Sun, Moon and Stars", start: 120 },
  { name: "Day 5 — Sea and Sky Life", start: 150 },
  { name: "Day 6 — Animals and Humanity", start: 180 },
  { name: "Day 7 — Rest", start: 210 }
];

export function getSceneAtTime(time: number): SceneMarker {
  return [...scenes]
    .reverse()
    .find(scene => time >= scene.start) ?? scenes[0];
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}
