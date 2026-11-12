import React, { useEffect, useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { PHASES, backOut, clamp01, progress } from "../timeline";
import { Assemble } from "./helpers";
import { PALETTE, mulberry32, plasterTexture, woodTexture } from "./materials";

export const ROOM = { W: 4, D: 4, H: 2.7, T: 0.15, FLOOR_Y: 0.02 };
const { W, D, H, T, FLOOR_Y } = ROOM;

/* ------------------------------------------------------------------ */
/* Cangkang ruangan: alas maket, dinding belakang & kiri (cutaway)      */
/* ------------------------------------------------------------------ */
export const Shell: React.FC = () => {
  const frame = useCurrentFrame();
  // Dinding berubah dari plester abu ke limewash beige hangat di fase 3
  const wallT = progress(frame, PHASES.walls.from, 30);
  const wallColor = useMemo(() => new THREE.Color(), []);
  wallColor.set(PALETTE.plasterGrey).lerp(new THREE.Color(PALETTE.beigeWall), wallT);
  const plaster = plasterTexture("wall");

  const wallMats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.95 });
    const cap = new THREE.MeshStandardMaterial({ color: PALETTE.charcoal, roughness: 0.9 });
    // urutan face BoxGeometry: +x, -x, +y, -y, +z, -z  (atas = potongan dinding gelap)
    return { side, list: [side, side, cap, side, side, side] };
  }, [plaster]);
  wallMats.side.color.copy(wallColor);

  return (
    <group>
      {/* alas maket arsitektur */}
      <mesh position={[-T / 2, -0.15, -T / 2]}>
        <boxGeometry args={[W + T + 0.001, 0.3, D + T + 0.001]} />
        <meshStandardMaterial color={PALETTE.concrete} roughness={0.95} />
      </mesh>
      {/* dinding belakang */}
      <mesh position={[-T / 2, H / 2, -D / 2 - T / 2]} material={wallMats.list}>
        <boxGeometry args={[W + T, H, T]} />
      </mesh>
      {/* dinding kiri */}
      <mesh position={[-W / 2 - T / 2, H / 2, 0]} material={wallMats.list}>
        <boxGeometry args={[T, H, D]} />
      </mesh>
      {/* penangkap bayangan di bawah maket */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} userData={{ noShadow: true }} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Fase 2: papan lantai kayu oak dipasang satu per satu                 */
/* ------------------------------------------------------------------ */
type Plank = { x: number; z: number; len: number; order: number; tint: number; tex: number };

export const WoodFloor: React.FC = () => {
  const frame = useCurrentFrame();
  const plankW = 0.2;

  const planks = useMemo(() => {
    const rnd = mulberry32(42);
    const list: Plank[] = [];
    const rows = Math.ceil(D / plankW);
    for (let r = 0; r < rows; r++) {
      const z = -D / 2 + plankW / 2 + r * plankW;
      let x = -W / 2;
      let first = true;
      while (x < W / 2 - 0.01) {
        let len = first ? 0.3 + rnd() * 0.9 : 0.9 + rnd() * 0.6;
        first = false;
        len = Math.min(len, W / 2 - x);
        list.push({ x: x + len / 2, z, len, order: 0, tint: rnd(), tex: Math.floor(rnd() * 4) });
        x += len;
      }
    }
    // urutan pemasangan: menyapu diagonal dari sudut belakang-kiri
    list.forEach((p) => (p.order = (p.z + D / 2) / D + (p.x + W / 2) / W * 0.6));
    const max = Math.max(...list.map((p) => p.order));
    list.forEach((p) => (p.order /= max));
    return list;
  }, []);

  const textures = useMemo(
    () => [0, 1, 2, 3].map((i) => woodTexture(`floor${i}`, { seed: 100 + i * 17, repeat: [1, 1] })),
    [],
  );
  const mats = useMemo(
    () =>
      planks.map((p) => {
        const c = new THREE.Color(PALETTE.oakLight).lerp(new THREE.Color(PALETTE.oakDark), p.tint * 0.35);
        return new THREE.MeshStandardMaterial({
          map: textures[p.tex],
          bumpMap: textures[p.tex],
          bumpScale: 0.6,
          color: c.multiplyScalar(1.15),
          roughness: 0.55,
          metalness: 0,
        });
      }),
    [planks, textures],
  );
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);

  const start = PHASES.floor.from;
  const span = 80; // frame penyebaran pemasangan
  const dur = 22;

  return (
    <group>
      {planks.map((p, i) => {
        const t0 = start + p.order * span;
        if (frame < t0) return null;
        const k = clamp01((frame - t0) / dur);
        const e = backOut(k);
        const lift = (1 - e) * 1.1;
        return (
          <mesh
            key={i}
            material={mats[i]}
            position={[p.x - (1 - e) * 0.25, FLOOR_Y / 2 + lift, p.z]}
            rotation={[(1 - e) * 0.5, 0, (1 - e) * -0.35]}
          >
            <boxGeometry args={[p.len - 0.005, FLOOR_Y, plankW - 0.005]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Fase 3: panel slat, backdrop arch, dan elemen wavy                   */
/* ------------------------------------------------------------------ */
const archShape = (w: number, h: number) => {
  const r = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(r, 0);
  if (h <= r) {
    s.absellipse(0, 0, r, Math.max(h, 0.001), 0, Math.PI, false);
  } else {
    s.lineTo(r, h - r);
    s.absarc(0, h - r, r, 0, Math.PI, false);
  }
  s.closePath();
  return s;
};

export const useArchGeometry = (w: number, h: number, depth: number, bevel = 0.012) => {
  const key = h.toFixed(3);
  const geo = useMemo(
    () =>
      new THREE.ExtrudeGeometry(archShape(w, h), {
        depth,
        bevelEnabled: bevel > 0,
        bevelSize: bevel,
        bevelThickness: bevel,
        bevelSegments: 3,
        curveSegments: 48,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w, key, depth, bevel],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
};

export const ARCH = { x: 0.4, w: 2.3, h: 2.25 };

export const WallFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = PHASES.walls.from;

  /* --- slat kayu vertikal di dinding belakang --- */
  const slatTex = woodTexture("slat", { seed: 5, vertical: true, repeat: [0.15, 1] });
  const slatMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: slatTex, color: "#e3c39c", roughness: 0.6 }),
    [slatTex],
  );
  const slatW = 0.045;
  const gap = 0.03;
  const slatH = 2.42;
  const slats = useMemo(() => {
    const out: number[] = [];
    for (let x = -W / 2 + 0.05; x < W / 2 - 0.02; x += slatW + gap) out.push(x + slatW / 2);
    return out;
  }, []);

  /* --- arch backdrop tumbuh dari lantai --- */
  const archP = progress(frame, t0 + 45, 55);
  const archGeo = useArchGeometry(ARCH.w, Math.max(0.02, ARCH.h * archP), 0.04);
  const haloGeo = useArchGeometry(ARCH.w + 0.08, Math.max(0.02, (ARCH.h + 0.04) * archP), 0.01, 0);
  const archTex = plasterTexture("arch", 23);

  /* --- wainscot bergelombang (wavy) di dinding kiri --- */
  const waveP = progress(frame, t0 + 70, 70);
  const waveLen = 2.1;
  const waveGeo = useMemo(() => {
    const L = Math.max(0.02, waveLen * waveP);
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    const steps = Math.max(2, Math.round(160 * waveP));
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * L;
      const y = 0.95 + 0.075 * Math.cos((x / 0.42) * Math.PI * 2);
      s.lineTo(x, y);
    }
    s.lineTo(L, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 3 });
  }, [waveP]);
  useEffect(() => () => waveGeo.dispose(), [waveGeo]);
  const waveTex = woodTexture("wave", { seed: 77, repeat: [0.6, 1.6] });

  const ledOn = progress(frame, PHASES.ceiling.from + 40, 45);

  return (
    <group>
      {/* Slat kayu: naik dari lantai, menyebar dari tengah ke tepi */}
      {slats.map((x, i) => {
        const order = Math.abs(x - ARCH.x) / (W / 2 + 0.4);
        const s0 = t0 + 4 + order * 50;
        if (frame < s0) return null;
        const k = backOut(clamp01((frame - s0) / 18));
        return (
          <mesh key={i} material={slatMat} position={[x, FLOOR_Y + (slatH * k) / 2, -D / 2 + 0.018]} scale={[1, Math.max(k, 0.001), 1]}>
            <boxGeometry args={[slatW, slatH, 0.035]} />
          </mesh>
        );
      })}

      {/* Backdrop arch linen + halo LED tersembunyi */}
      {archP > 0 && (
        <group position={[ARCH.x, FLOOR_Y, -D / 2 + 0.04]}>
          <mesh geometry={haloGeo} position={[0, 0, -0.005]} userData={{ noShadow: true }}>
            <meshStandardMaterial color="#f1e4d0" emissive={PALETTE.warmLight} emissiveIntensity={ledOn * 3.2} roughness={1} />
          </mesh>
          <mesh geometry={archGeo} position={[0, 0, 0.012]}>
            <meshStandardMaterial map={archTex} color="#e2d3bd" roughness={0.95} />
          </mesh>
        </group>
      )}

      {/* Wainscot wavy dari sudut belakang menuju depan */}
      {waveP > 0 && (
        <mesh geometry={waveGeo} position={[-W / 2 + 0.032, FLOOR_Y, -D / 2 + 0.02]} rotation={[0, -Math.PI / 2, 0]}>
          <meshStandardMaterial map={waveTex} color="#d8b38a" roughness={0.6} />
        </mesh>
      )}
      {/* lis gelombang tipis (aksen walnut) mengikuti puncak wainscot */}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Fase 4: drop ceiling (bulkhead) + LED tersembunyi + lampu gantung    */
/* ------------------------------------------------------------------ */
export const BULK = { depth: 0.45, h: 0.26 };

const wavyLanternGeo = () => {
  const pts: THREE.Vector2[] = [];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = t * 0.42;
    const r = (0.04 + Math.sin(t * Math.PI) * 0.17) * (1 + 0.06 * Math.sin(t * Math.PI * 9));
    pts.push(new THREE.Vector2(Math.max(0.01, r), y));
  }
  return new THREE.LatheGeometry(pts, 64);
};

export const Ceiling: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = PHASES.ceiling.from;
  const ledOn = progress(frame, t0 + 40, 45);
  const lanternGeo = useMemo(wavyLanternGeo, []);
  const bulkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f3ece2", roughness: 0.9 }), []);
  const ledMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff4e0", emissive: PALETTE.warmLight, roughness: 1 }), []);
  ledMat.emissiveIntensity = 0.2 + ledOn * 6;

  const yB = H - BULK.h / 2;
  const ledSweep = clamp01(interpolate(frame, [t0 + 35, t0 + 80], [0, 1]));

  return (
    <group>
      {/* bulkhead belakang & kiri turun dari atas */}
      <Assemble start={t0} dur={26} from={[0, 1.6, 0]}>
        <mesh material={bulkMat} position={[0.03, yB, -D / 2 + BULK.depth / 2 + 0.06]}>
          <boxGeometry args={[W - 0.06, BULK.h, BULK.depth]} />
        </mesh>
      </Assemble>
      <Assemble start={t0 + 10} dur={26} from={[0, 1.6, 0]}>
        <mesh material={bulkMat} position={[-W / 2 + BULK.depth / 2 + 0.06, yB, (D / 2 - D / 2 + 0.06 + BULK.depth) / 2]}>
          <boxGeometry args={[BULK.depth, BULK.h, D - BULK.depth - 0.06]} />
        </mesh>
      </Assemble>

      {/* strip LED tersembunyi di celah bulkhead-dinding (wall washer) */}
      {ledSweep > 0 && (
        <>
          <mesh material={ledMat} userData={{ noShadow: true }} position={[-W / 2 + (W * ledSweep) / 2, H - BULK.h - 0.005, -D / 2 + 0.04]} scale={[ledSweep, 1, 1]}>
            <boxGeometry args={[W, 0.012, 0.03]} />
          </mesh>
          <mesh material={ledMat} userData={{ noShadow: true }} position={[-W / 2 + 0.04, H - BULK.h - 0.005, -D / 2 + (D * ledSweep) / 2]} scale={[1, 1, ledSweep]}>
            <boxGeometry args={[0.03, 0.012, D]} />
          </mesh>
          {/* garis cove pada tepi depan bulkhead */}
          <mesh material={ledMat} userData={{ noShadow: true }} position={[-W / 2 + 0.25 + ((W - 0.5) * ledSweep) / 2, H - BULK.h - 0.006, -D / 2 + 0.06 + BULK.depth + 0.006]} scale={[ledSweep, 1, 1]}>
            <boxGeometry args={[W - 0.5, 0.012, 0.012]} />
          </mesh>
        </>
      )}

      {/* lampu gantung kertas bergelombang di atas nakas */}
      {[-0.78, 1.58].map((x, i) => (
        <Assemble key={x} start={t0 + 55 + i * 8} dur={30} from={[0, 1.2, 0]}>
          <group position={[x, 1.3, -1.68]}>
            <mesh position={[0, 0.42 + (H - BULK.h - 1.72) / 2, 0]} userData={{ noShadow: true }}>
              <cylinderGeometry args={[0.004, 0.004, H - BULK.h - 1.72, 6]} />
              <meshStandardMaterial color={PALETTE.charcoal} />
            </mesh>
            <mesh geometry={lanternGeo} userData={{ noShadow: true }}>
              <meshStandardMaterial color="#fbf3e6" emissive={PALETTE.warmLight} emissiveIntensity={0.15 + ledOn * 1.6} roughness={1} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </Assemble>
      ))}
    </group>
  );
};
