import * as THREE from "three";

/** PRNG deterministik agar setiap frame render identik */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const PALETTE = {
  oak: "#C9A47C",
  oakLight: "#D9BC95",
  oakDark: "#A27B55",
  walnut: "#6B4A33",
  beigeWall: "#E9DDCC",
  plasterGrey: "#CFCCC7",
  linen: "#EFE8DC",
  linenWarm: "#E4D6C1",
  boucle: "#E7DED0",
  clay: "#B9876A",
  sage: "#9AA28A",
  charcoal: "#3C3833",
  concrete: "#B9B4AC",
  warmLight: "#FFC98A",
};

const cache = new Map<string, THREE.Texture>();

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

/** Tekstur serat kayu prosedural (serat horizontal di kanvas) */
const drawWood = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  base: string,
  dark: string,
) => {
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  // pita warna lebar
  for (let i = 0; i < 10; i++) {
    const y = rnd() * h;
    const g = ctx.createLinearGradient(0, y - 40, 0, y + 40);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, rnd() > 0.5 ? "rgba(255,240,215,0.10)" : "rgba(90,55,25,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 40, w, 80);
  }
  // serat
  ctx.strokeStyle = dark;
  for (let i = 0; i < 170; i++) {
    const y0 = rnd() * h;
    const amp = 1 + rnd() * 6;
    const freq = 0.002 + rnd() * 0.01;
    const ph = rnd() * 10;
    ctx.globalAlpha = 0.04 + rnd() * 0.22;
    ctx.lineWidth = 0.4 + rnd() * 1.8;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = y0 + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 3.3 + ph) * amp * 0.3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // mata kayu (knot) sesekali
  for (let k = 0; k < 2; k++) {
    if (rnd() < 0.5) continue;
    const cx = rnd() * w;
    const cy = rnd() * h;
    for (let r = 2; r < 18; r += 2.5) {
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 3.2, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // pori halus
  ctx.globalAlpha = 1;
  const img = ctx.getImageData(0, 0, w, h);
  for (let p = 0; p < img.data.length; p += 4) {
    const n = (rnd() - 0.5) * 10;
    img.data[p] += n;
    img.data[p + 1] += n;
    img.data[p + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
};

export const woodTexture = (
  key: string,
  opts: { seed?: number; base?: string; dark?: string; vertical?: boolean; repeat?: [number, number] } = {},
) => {
  const id = `wood-${key}`;
  if (cache.has(id)) return cache.get(id)!;
  const c = makeCanvas(1024, 256);
  drawWood(c.getContext("2d")!, 1024, 256, opts.seed ?? 7, opts.base ?? PALETTE.oak, opts.dark ?? "#7a5534");
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (opts.vertical) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
  }
  if (opts.repeat) t.repeat.set(...opts.repeat);
  cache.set(id, t);
  return t;
};

/** Tekstur kain linen / bouclé */
export const fabricTexture = (key: string, base: string, seed = 3, repeat = 4) => {
  const id = `fabric-${key}`;
  if (cache.has(id)) return cache.get(id)!;
  const w = 256;
  const c = makeCanvas(w, w);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, w);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * w;
    const y = rnd() * w;
    const horiz = rnd() > 0.5;
    ctx.strokeStyle = rnd() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(80,60,40,0.07)";
    ctx.lineWidth = 0.6 + rnd();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (horiz ? 4 + rnd() * 8 : 0), y + (horiz ? 0 : 4 + rnd() * 8));
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  cache.set(id, t);
  return t;
};

/** Tekstur plester limewash (noda lembut) */
export const plasterTexture = (key: string, seed = 11) => {
  const id = `plaster-${key}`;
  if (cache.has(id)) return cache.get(id)!;
  const w = 512;
  const c = makeCanvas(w, w);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, w);
  for (let i = 0; i < 220; i++) {
    const x = rnd() * w;
    const y = rnd() * w;
    const r = 20 + rnd() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rnd() > 0.5;
    g.addColorStop(0, dark ? "rgba(120,100,80,0.022)" : "rgba(255,255,255,0.04)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  cache.set(id, t);
  return t;
};
