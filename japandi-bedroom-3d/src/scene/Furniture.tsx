import React, { useEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { PHASES, backOut, clamp01 } from "../timeline";
import { Assemble, RBox } from "./helpers";
import { PALETTE, fabricTexture, mulberry32, woodTexture } from "./materials";
import { ROOM, useArchGeometry } from "./Room";

const { W, D, FLOOR_Y } = ROOM;
const F = PHASES.furniture.from; // 510

/* ---------------- material bersama ---------------- */
const useMats = () =>
  useMemo(() => {
    const oak = woodTexture("furn-oak", { seed: 9, repeat: [1, 1] });
    const oakV = woodTexture("furn-oak-v", { seed: 19, vertical: true, repeat: [0.6, 1] });
    const walnut = woodTexture("walnut", { seed: 31, base: PALETTE.walnut, dark: "#3b2617" });
    return {
      oak: new THREE.MeshStandardMaterial({ map: oak, bumpMap: oak, bumpScale: 0.4, color: "#ead0ad", roughness: 0.55 }),
      oakV: new THREE.MeshStandardMaterial({ map: oakV, color: "#ead0ad", roughness: 0.55 }),
      walnut: new THREE.MeshStandardMaterial({ map: walnut, color: "#ffffff", roughness: 0.5 }),
      linen: new THREE.MeshStandardMaterial({ map: fabricTexture("linen", PALETTE.linen, 3, 6), roughness: 0.95 }),
      duvet: new THREE.MeshStandardMaterial({ map: fabricTexture("duvet", "#F4EFE6", 5, 8), roughness: 1 }),
      boucle: new THREE.MeshStandardMaterial({ map: fabricTexture("boucle", PALETTE.boucle, 7, 10), roughness: 1 }),
      clay: new THREE.MeshStandardMaterial({ map: fabricTexture("clay", PALETTE.clay, 13, 6), roughness: 1 }),
      sage: new THREE.MeshStandardMaterial({ map: fabricTexture("sage", PALETTE.sage, 17, 6), roughness: 1 }),
      rug: new THREE.MeshStandardMaterial({ map: fabricTexture("rug", "#DCCDB6", 21, 14), roughness: 1 }),
      rugBorder: new THREE.MeshStandardMaterial({ map: fabricTexture("rugb", "#C4AE8E", 23, 14), roughness: 1 }),
      ceramic: new THREE.MeshStandardMaterial({ color: "#E9E1D4", roughness: 0.35 }),
      ceramicDark: new THREE.MeshStandardMaterial({ color: "#8C7B6B", roughness: 0.6 }),
      charcoal: new THREE.MeshStandardMaterial({ color: PALETTE.charcoal, roughness: 0.6 }),
      mirror: new THREE.MeshStandardMaterial({ color: "#d8dde0", metalness: 1, roughness: 0.04, envMapIntensity: 1.4 }),
      leaf: new THREE.MeshStandardMaterial({ color: "#7E8C6A", roughness: 0.8 }),
      branch: new THREE.MeshStandardMaterial({ color: "#5e4632", roughness: 0.9 }),
    };
  }, []);
type Mats = ReturnType<typeof useMats>;

/* ---------------- karpet organik ---------------- */
const blobShape = (rx: number, rz: number, seed: number, wob = 0.07) => {
  const rnd = mulberry32(seed);
  const a = [rnd() * 6, rnd() * 6, rnd() * 6];
  const s = new THREE.Shape();
  const n = 96;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + wob * Math.sin(2 * t + a[0]) + wob * 0.6 * Math.sin(3 * t + a[1]) + wob * 0.3 * Math.sin(5 * t + a[2]);
    const x = Math.cos(t) * rx * k;
    const y = Math.sin(t) * rz * k;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
};

const Rug: React.FC<{ m: Mats }> = ({ m }) => {
  const geo = useMemo(() => new THREE.ExtrudeGeometry(blobShape(1.45, 1.25, 4), { depth: 0.012, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.004, bevelSegments: 2 }), []);
  const inner = useMemo(() => new THREE.ExtrudeGeometry(blobShape(1.3, 1.1, 4), { depth: 0.002, bevelEnabled: false }), []);
  return (
    <Assemble start={F} dur={24} position={[0.35, FLOOR_Y, -0.35]} from={[0, 0.02, 0]} scaleFrom={[0.05, 1, 0.05]} rotFrom={[0, 1.2, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={geo} material={m.rugBorder} />
        <mesh geometry={inner} material={m.rug} position={[0, 0, 0.0145]} />
      </group>
    </Assemble>
  );
};

/* ---------------- tempat tidur ---------------- */
export const BED = { x: 0.4, z: -0.72, w: 1.75, l: 2.1 };

const Bed: React.FC<{ m: Mats }> = ({ m }) => {
  const frame = useCurrentFrame();
  const s0 = F + 12;
  const tufts = 9;
  const capsuleGeo = useMemo(() => new THREE.CapsuleGeometry(0.095, 0.82, 8, 24), []);
  useEffect(() => () => capsuleGeo.dispose(), [capsuleGeo]);
  return (
    <group position={[BED.x, FLOOR_Y, BED.z]}>
      {/* plinth tersembunyi */}
      <Assemble start={s0} dur={18} from={[0, -0.3, 0]}>
        <RBox size={[BED.w - 0.3, 0.1, BED.l - 0.3]} radius={0.02} position={[0, 0.05, 0]}>
          <primitive object={m.charcoal} attach="material" />
        </RBox>
      </Assemble>
      {/* rangka platform oak membulat */}
      <Assemble start={s0 + 8} dur={24} from={[0, 2.2, 0]} rotFrom={[0, 0.5, 0]}>
        <RBox size={[BED.w, 0.24, BED.l]} radius={0.08} position={[0, 0.22, 0]}>
          <primitive object={m.oak} attach="material" />
        </RBox>
      </Assemble>
      {/* headboard channel-tufted: kapsul naik bergelombang */}
      {Array.from({ length: tufts }).map((_, i) => {
        const x = -BED.w / 2 + 0.1 + (i * (BED.w - 0.2)) / (tufts - 1);
        const st = s0 + 22 + Math.abs(i - (tufts - 1) / 2) * 3;
        if (frame < st) return null;
        const k = backOut(clamp01((frame - st) / 18));
        return (
          <mesh key={i} geometry={capsuleGeo} material={m.boucle} position={[x, 0.3 + 0.5 * k - 0.6 * (1 - k), -BED.l / 2 - 0.02]} scale={[1, Math.max(0.01, k), 1]} />
        );
      })}
      {/* matras */}
      <Assemble start={s0 + 30} dur={20} from={[0, 1.6, 0]}>
        <RBox size={[BED.w - 0.14, 0.2, BED.l - 0.14]} radius={0.07} position={[0, 0.43, 0.02]}>
          <primitive object={m.linen} attach="material" />
        </RBox>
      </Assemble>
      {/* duvet linen: terbentang */}
      <Assemble start={s0 + 42} dur={24} position={[0, 0.56, 0.3]} from={[0, 0.9, 0.6]} rotFrom={[-0.8, 0, 0]} scaleFrom={[0.3, 1, 0.2]}>
        <RBox size={[BED.w - 0.06, 0.08, 1.5]} radius={0.035}>
          <primitive object={m.duvet} attach="material" />
        </RBox>
        {/* lipatan atas duvet */}
        <RBox size={[BED.w - 0.04, 0.09, 0.22]} radius={0.04} position={[0, 0.02, -0.72]}>
          <primitive object={m.duvet} attach="material" />
        </RBox>
      </Assemble>
      {/* selimut aksen clay di kaki tempat tidur */}
      <Assemble start={s0 + 54} dur={20} position={[0, 0.62, 0.78]} from={[0.9, 0.8, 0]} rotFrom={[0, 0, 0.6]}>
        <RBox size={[BED.w + 0.02, 0.05, 0.42]} radius={0.024}>
          <primitive object={m.clay} attach="material" />
        </RBox>
      </Assemble>
      {/* bantal */}
      {[
        { x: -0.42, mat: m.linen, d: 0, r: 0.25 },
        { x: 0.42, mat: m.linen, d: 4, r: 0.25 },
        { x: -0.18, mat: m.sage, d: 9, r: 0.45, small: true },
        { x: 0.22, mat: m.clay, d: 13, r: 0.45, small: true },
      ].map((p, i) => (
        <Assemble key={i} start={s0 + 60 + p.d} dur={16} position={[p.x, p.small ? 0.66 : 0.64, p.small ? -0.62 : -0.78]} rotation={[-p.r, 0, 0]} from={[0, 0.8, 0]} scaleFrom={0.2}>
          <RBox size={p.small ? [0.42, 0.13, 0.32] : [0.68, 0.16, 0.42]} radius={0.065}>
            <primitive object={p.mat} attach="material" />
          </RBox>
        </Assemble>
      ))}
    </group>
  );
};

/* ---------------- nakas ---------------- */
const Nightstand: React.FC<{ m: Mats; x: number; start: number; decor: "books" | "vase" }> = ({ m, x, start, decor }) => (
  <group position={[x, FLOOR_Y, -1.7]}>
    {/* kaki */}
    {[[-0.17, -0.13], [0.17, -0.13], [-0.17, 0.13], [0.17, 0.13]].map(([lx, lz], i) => (
      <Assemble key={i} start={start + i * 2} dur={14} position={[lx, 0.07, lz]} from={[0, -0.14, 0]} scaleFrom={[1, 0.01, 1]}>
        <mesh material={m.walnut}>
          <cylinderGeometry args={[0.016, 0.012, 0.14, 12]} />
        </mesh>
      </Assemble>
    ))}
    {/* badan */}
    <Assemble start={start + 8} dur={20} from={[0, 1.5, 0]} rotFrom={[0, 0.8, 0]}>
      <RBox size={[0.46, 0.36, 0.38]} radius={0.06} position={[0, 0.32, 0]}>
        <primitive object={m.oak} attach="material" />
      </RBox>
    </Assemble>
    {/* laci meluncur masuk */}
    <Assemble start={start + 20} dur={18} position={[0, 0.32, 0.192]} from={[0, 0, 0.35]}>
      <RBox size={[0.4, 0.28, 0.02]} radius={0.009}>
        <primitive object={m.oakV} attach="material" />
      </RBox>
      <mesh material={m.walnut} position={[0, 0.06, 0.016]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.01, 0.1, 4, 8]} />
      </mesh>
    </Assemble>
    {/* dekorasi */}
    {decor === "books" ? (
      <Assemble start={start + 30} dur={16} position={[0.05, 0.5, 0.02]} from={[0, 0.6, 0]} scaleFrom={0.3}>
        <RBox size={[0.24, 0.035, 0.17]} radius={0.006} position={[0, 0.018, 0]}>
          <primitive object={m.ceramicDark} attach="material" />
        </RBox>
        <RBox size={[0.21, 0.03, 0.15]} radius={0.006} position={[0.01, 0.05, 0]} rotation={[0, 0.2, 0]}>
          <primitive object={m.linen} attach="material" />
        </RBox>
        <mesh material={m.ceramic} position={[-0.02, 0.1, 0]}>
          <sphereGeometry args={[0.035, 24, 16]} />
        </mesh>
      </Assemble>
    ) : (
      <Assemble start={start + 30} dur={20} position={[-0.06, 0.5, 0]} from={[0, 0.6, 0]} scaleFrom={0.2}>
        <Vase m={m} />
      </Assemble>
    )}
  </group>
);

const Vase: React.FC<{ m: Mats }> = ({ m }) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      pts.push(new THREE.Vector2(0.02 + Math.sin(t * Math.PI * 0.95) * 0.07 + (t > 0.85 ? (t - 0.85) * 0.2 : 0), t * 0.24));
    }
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  return (
    <group>
      <mesh geometry={geo} material={m.ceramicDark} />
      {/* ranting kering */}
      {[-0.35, 0.1, 0.5].map((a, i) => (
        <mesh key={i} material={m.branch} position={[Math.sin(a) * 0.12, 0.42 + i * 0.03, 0]} rotation={[0, 0, -a]}>
          <cylinderGeometry args={[0.003, 0.005, 0.45, 5]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------------- lemari pakaian ---------------- */
const WARD = { z0: 0.3, w: 1.62, d: 0.6, h: 2.2 };

const Wardrobe: React.FC<{ m: Mats; start: number }> = ({ m, start }) => {
  const frame = useCurrentFrame();
  const doors = 3;
  const dw = WARD.w / doors;
  const doorGeo = useArchGeometry(dw - 0.012, WARD.h - 0.14, 0.025, 0.006);
  const x0 = -W / 2 + WARD.d; // muka depan lemari
  const cz = WARD.z0 + WARD.w / 2;
  // carcass tumbuh dari lantai
  const k = backOut(clamp01((frame - start) / 22));
  if (frame < start) return null;
  return (
    <group>
      <group position={[-W / 2 + WARD.d / 2, FLOOR_Y, cz]} scale={[1, Math.max(0.01, k), 1]}>
        <RBox size={[WARD.d - 0.02, WARD.h, WARD.w]} radius={0.04} position={[0, WARD.h / 2, 0]}>
          <meshStandardMaterial color="#d9c2a3" roughness={0.7} />
        </RBox>
        {/* plinth gelap */}
        <mesh material={m.charcoal} position={[0.02, 0.035, 0]}>
          <boxGeometry args={[WARD.d - 0.06, 0.07, WARD.w - 0.06]} />
        </mesh>
      </group>
      {/* pintu ber-arch mengayun menutup dari engsel */}
      {Array.from({ length: doors }).map((_, i) => {
        const ds = start + 18 + i * 7;
        if (frame < ds) return null;
        const t = backOut(clamp01((frame - ds) / 22));
        const hingeZ = WARD.z0 + i * dw + 0.006;
        return (
          <group key={i} position={[x0, FLOOR_Y + 0.08, hingeZ]} rotation={[0, (1 - t) * 1.9, 0]}>
            <mesh geometry={doorGeo} material={m.oakV} position={[0.006, 0, (dw - 0.012) / 2]} rotation={[0, Math.PI / 2, 0]} />
            {/* pegangan walnut vertikal */}
            <mesh material={m.walnut} position={[0.05, 1.0, i === 2 ? 0.07 : dw - 0.07]}>
              <capsuleGeometry args={[0.012, 0.32, 4, 10]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/* ---------------- meja rias + cermin wavy + stool ---------------- */
const VAN = { z: -0.95, w: 1.0, d: 0.46, h: 0.74 };

const mirrorShape = (r: number) => {
  const s = new THREE.Shape();
  const n = 120;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + 0.045 * Math.sin(7 * t);
    const x = Math.cos(t) * r * 0.82 * k;
    const y = Math.sin(t) * r * k;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
};

const Vanity: React.FC<{ m: Mats; start: number }> = ({ m, start }) => {
  const frameGeo = useMemo(() => new THREE.ExtrudeGeometry(mirrorShape(0.4), { depth: 0.025, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 3 }), []);
  const glassGeo = useMemo(() => new THREE.ExtrudeGeometry(mirrorShape(0.36), { depth: 0.006, bevelEnabled: false }), []);
  const x = -W / 2 + VAN.d / 2 + 0.02;
  return (
    <group>
      {/* kaki panel melengkung */}
      {[-1, 1].map((sgn, i) => (
        <Assemble key={i} start={start + i * 4} dur={18} position={[x, FLOOR_Y + (VAN.h - 0.04) / 2, VAN.z + sgn * (VAN.w / 2 - 0.06)]} from={[0, -0.4, 0]} scaleFrom={[1, 0.01, 1]}>
          <RBox size={[VAN.d - 0.06, VAN.h - 0.04, 0.05]} radius={0.022}>
            <primitive object={m.oakV} attach="material" />
          </RBox>
        </Assemble>
      ))}
      {/* daun meja */}
      <Assemble start={start + 12} dur={20} position={[x, FLOOR_Y + VAN.h - 0.02, VAN.z]} from={[0, 1.4, 0]} rotFrom={[0, 0, 0.4]}>
        <RBox size={[VAN.d, 0.045, VAN.w]} radius={0.02}>
          <primitive object={m.oak} attach="material" />
        </RBox>
      </Assemble>
      {/* laci tipis */}
      <Assemble start={start + 22} dur={16} position={[x + 0.02, FLOOR_Y + VAN.h - 0.11, VAN.z]} from={[0.4, 0, 0]}>
        <RBox size={[VAN.d - 0.08, 0.1, VAN.w - 0.2]} radius={0.015}>
          <primitive object={m.oak} attach="material" />
        </RBox>
      </Assemble>
      {/* cermin organik bergelombang */}
      <Assemble start={start + 26} dur={24} position={[-W / 2 + 0.05, FLOOR_Y + 1.48, VAN.z]} rotation={[0, Math.PI / 2, 0]} from={[0, 0, 0]} rotFrom={[0, 0, Math.PI]} scaleFrom={0.01}>
        <mesh geometry={frameGeo} material={m.oak} />
        <mesh geometry={glassGeo} material={m.mirror} position={[0, 0, 0.036]} userData={{ noShadow: true }} />
      </Assemble>
      {/* vas kecil di meja */}
      <Assemble start={start + 40} dur={14} position={[x + 0.02, FLOOR_Y + VAN.h + 0.003, VAN.z + 0.3]} from={[0, 0.4, 0]} scaleFrom={0.2}>
        <mesh material={m.ceramic} position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.06, 24, 16]} />
        </mesh>
      </Assemble>
      {/* stool bouclé menggelinding masuk */}
      <Assemble start={start + 34} dur={22} position={[x + 0.42, FLOOR_Y, VAN.z + 0.05]} from={[0.8, 0, 0.6]} rotFrom={[0, 0, 0]} scaleFrom={0.5}>
        <RBox size={[0.4, 0.26, 0.4]} radius={0.13} position={[0, 0.3, 0]}>
          <primitive object={m.boucle} attach="material" />
        </RBox>
        <mesh material={m.walnut} position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.18, 32]} />
        </mesh>
      </Assemble>
    </group>
  );
};

/* ---------------- tanaman zaitun di pot ---------------- */
const Plant: React.FC<{ m: Mats; start: number; position: [number, number, number] }> = ({ m, start, position }) => {
  const frame = useCurrentFrame();
  const potGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(new THREE.Vector2(0.001 + Math.min(1, t * 8) * (0.13 + Math.sin(t * Math.PI) * 0.05), t * 0.42));
    }
    return new THREE.LatheGeometry(pts, 48);
  }, []);
  const leaves = useMemo(() => {
    const rnd = mulberry32(8);
    return Array.from({ length: 110 }).map(() => {
      const a = rnd() * Math.PI * 2;
      const r = 0.04 + rnd() * 0.24;
      const y = 0.95 + rnd() * 0.75;
      return { p: [Math.cos(a) * r, y, Math.sin(a) * r] as [number, number, number], s: 0.03 + rnd() * 0.03, d: rnd() };
    });
  }, []);
  if (frame < start) return null;
  const g = clamp01((frame - start) / 30);
  return (
    <group position={position}>
      <Assemble start={start} dur={16} from={[0, 1, 0]}>
        <mesh geometry={potGeo} material={m.ceramic} />
      </Assemble>
      <group scale={[1, Math.max(0.01, backOut(g)), 1]}>
        <mesh material={m.branch} position={[0, 0.75, 0]} rotation={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.012, 0.022, 0.75, 8]} />
        </mesh>
      </group>
      {leaves.map((l, i) => {
        const k = backOut(clamp01((frame - start - 10 - l.d * 18) / 14));
        if (k <= 0) return null;
        return (
          <mesh key={i} material={m.leaf} position={l.p} scale={[l.s * k, l.s * 0.5 * k, l.s * 1.6 * k]} rotation={[l.d * 3, l.d * 5, 0]}>
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Furniture: React.FC = () => {
  const m = useMats();
  return (
    <group>
      <Rug m={m} />
      <Bed m={m} />
      <Nightstand m={m} x={-0.78} start={F + 55} decor="books" />
      <Nightstand m={m} x={1.58} start={F + 62} decor="vase" />
      <Wardrobe m={m} start={F + 90} />
      <Vanity m={m} start={F + 120} />
      <Plant m={m} start={F + 165} position={[1.62, FLOOR_Y, -0.85]} />
    </group>
  );
};

export { D };
