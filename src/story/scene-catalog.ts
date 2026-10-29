import type { Backdrop, BeatFx } from "./story-types";

/** A point on a scene, in percent of its width and height (the drawn places are 160×90, see `scene-art.tsx`). */
export interface ScenePoint {
  x: number;
  y: number;
}

export interface SceneInfo {
  /** A place on the ground, drawn as a scene (`src/ui/scene-art.tsx`); the others are the city map and the laptop. */
  place: boolean;
  /** Where `focus` pushes the camera in, and how far. */
  focus?: ScenePoint & { scale: number };
  /** The path a `trace` streak follows. */
  trace?: ScenePoint[];
  /** Dot-matrix city: the only backdrop with `city_blink`, `eight_fragments`, `fragment_found`. */
  city?: boolean;
}

export const SCENES: Record<Backdrop, SceneInfo> = {
  // The city's trace leaves the Dark Zone (top right) for the gates below it.
  "thanh-pho": {
    place: false,
    city: true,
    trace: [{ x: 79, y: 21 }, { x: 68, y: 33 }, { x: 55, y: 44 }, { x: 40, y: 56 }, { x: 24, y: 70 }],
  },
  "vung-toi": { place: false, city: true },
  terminal: { place: false },
  "tang-ham": { place: true, focus: { x: 50, y: 69, scale: 1.4 } },
  "tram-r17": { place: true, focus: { x: 36, y: 16, scale: 1.3 } },
  "tram-khau-phan": { place: true, focus: { x: 61, y: 42, scale: 1.3 } },
  "ga-ngam": { place: true, focus: { x: 58, y: 51, scale: 1.5 } },
  "cong-bac": { place: true, focus: { x: 50, y: 33, scale: 1.3 } },
  "vanh-dai-dien": { place: true, focus: { x: 37, y: 33, scale: 1.3 } },
  "tram-tham-van": { place: true, focus: { x: 65, y: 33, scale: 1.35 } },
  "cong-kiem-soat": {
    place: true,
    focus: { x: 85, y: 56, scale: 1.5 },
    // Along the road, then up the gate's seam.
    trace: [{ x: 0, y: 86 }, { x: 20, y: 80 }, { x: 38, y: 73 }, { x: 49, y: 70 }, { x: 49, y: 50 }, { x: 49, y: 26 }],
  },
  "tram-sentinel": { place: true, focus: { x: 69, y: 16, scale: 1.35 } },
  "duong-ong": { place: true, focus: { x: 63, y: 29, scale: 1.5 } },
  "hang-rao-ngoai": {
    place: true,
    focus: { x: 41, y: 20, scale: 1.35 },
    // Along the foot of the fence, toward the far end.
    trace: [{ x: 0, y: 89 }, { x: 19, y: 78 }, { x: 38, y: 67 }, { x: 56, y: 57 }, { x: 68, y: 50 }],
  },
  "bai-container": { place: true, focus: { x: 25, y: 34, scale: 1.6 } },
  "thap-den-pha": { place: true, focus: { x: 50, y: 13, scale: 1.4 } },
  "nga-tu-tuan-tra": {
    place: true,
    focus: { x: 50, y: 33, scale: 1.4 },
    // One patrol route: up the near road to the crossing, then off to the right.
    trace: [{ x: 50, y: 98 }, { x: 50, y: 67 }, { x: 50, y: 54 }, { x: 69, y: 54 }, { x: 100, y: 54 }],
  },
  "tram-sac": { place: true, focus: { x: 79, y: 24, scale: 1.4 } },
};

const CITY_FX: readonly BeatFx[] = ["city_blink", "eight_fragments", "fragment_found"];

/** Whether `fx` means anything on `backdrop`; effects not tied to a scene work everywhere. */
export function fxSupported(backdrop: Backdrop, fx: BeatFx): boolean {
  const scene = SCENES[backdrop];
  if (CITY_FX.includes(fx)) return scene.city === true;
  if (fx === "focus") return scene.focus !== undefined;
  if (fx === "trace") return scene.trace !== undefined;
  return true;
}
