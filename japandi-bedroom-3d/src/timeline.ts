import { Easing, interpolate } from "remotion";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_IN_FRAMES = 30 * FPS; // 30 detik

/** Detik -> frame */
export const s = (sec: number) => Math.round(sec * FPS);

/** Fase sesuai brief (detik) */
export const PHASES = {
  empty: { from: s(0), to: s(4) },
  floor: { from: s(4), to: s(8) },
  walls: { from: s(8), to: s(13) },
  ceiling: { from: s(13), to: s(17) },
  furniture: { from: s(17), to: s(24) },
  reveal: { from: s(24), to: s(30) },
} as const;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Progres 0..1 antara dua frame, dengan easing */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = Easing.bezier(0.45, 0, 0.2, 1),
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Easing "settle" dengan sedikit overshoot — terasa seperti benda yang terpasang */
export const backOut = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
