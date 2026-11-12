import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { backOut, clamp01 } from "../timeline";

type V3 = [number, number, number];

/**
 * Animasi "assembly": anak-anaknya terbang dari posisi/rotasi/skala awal
 * menuju posisi akhir dan "mengunci" dengan sedikit overshoot.
 */
export const Assemble: React.FC<{
  start: number;
  dur?: number;
  position?: V3;
  rotation?: V3;
  from?: V3;
  rotFrom?: V3;
  scaleFrom?: number | V3;
  ease?: (t: number) => number;
  children: React.ReactNode;
}> = ({ start, dur = 20, position = [0, 0, 0], rotation = [0, 0, 0], from = [0, 1.5, 0], rotFrom = [0, 0, 0], scaleFrom = 1, ease = backOut, children }) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const p = ease(clamp01((frame - start) / dur));
  const q = 1 - p;
  const sf: V3 = typeof scaleFrom === "number" ? [scaleFrom, scaleFrom, scaleFrom] : scaleFrom;
  return (
    <group
      position={[position[0] + from[0] * q, position[1] + from[1] * q, position[2] + from[2] * q]}
      rotation={[rotation[0] + rotFrom[0] * q, rotation[1] + rotFrom[1] * q, rotation[2] + rotFrom[2] * q]}
      scale={[sf[0] + (1 - sf[0]) * p, sf[1] + (1 - sf[1]) * p, sf[2] + (1 - sf[2]) * p].map((v) => Math.max(0.0001, v)) as V3}
    >
      {children}
    </group>
  );
};

/** Kotak dengan sudut membulat (furnitur organik) */
export const RBox: React.FC<{
  size: V3;
  radius?: number;
  position?: V3;
  rotation?: V3;
  children?: React.ReactNode;
}> = ({ size, radius = 0.03, position, rotation, children }) => {
  const geo = useMemo(
    () => new RoundedBoxGeometry(size[0], size[1], size[2], 4, Math.min(radius, Math.min(...size) / 2 - 0.0005)),
    [size[0], size[1], size[2], radius],
  );
  return (
    <mesh geometry={geo} position={position} rotation={rotation}>
      {children}
    </mesh>
  );
};

/** Semua mesh menerima & memberi bayangan, kecuali yang ditandai userData.noShadow */
export const ShadowSetter: React.FC = () => {
  const scene = useThree((s) => s.scene);
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const lit = !o.userData.noShadow;
        o.castShadow = lit;
        o.receiveShadow = lit;
      }
    });
  }, [scene, frame]);
  return null;
};

/** Environment map prosedural (tanpa file HDRI) untuk pantulan & cahaya lembut */
export const ProceduralEnvironment: React.FC<{ intensity: number }> = ({ intensity }) => {
  const { gl, scene } = useThree();
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);
  useLayoutEffect(() => {
    scene.environment = env;
    scene.environmentIntensity = intensity;
  }, [scene, env, intensity]);
  return null;
};

/**
 * Spline kubik (Catmull-Rom non-uniform) agar gerak kamera mengalir mulus
 * melewati keyframe tanpa berhenti mendadak.
 */
export const spline = (times: number[], values: number[], t: number) => {
  const n = times.length;
  if (t <= times[0]) return values[0];
  if (t >= times[n - 1]) return values[n - 1];
  let i = 0;
  while (t > times[i + 1]) i++;
  const t0 = times[i];
  const t1 = times[i + 1];
  const h = t1 - t0;
  const u = (t - t0) / h;
  const tangent = (k: number) => {
    if (k === 0 || k === n - 1) return 0;
    return (values[k + 1] - values[k - 1]) / (times[k + 1] - times[k - 1]);
  };
  const m0 = tangent(i) * h;
  const m1 = tangent(i + 1) * h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * values[i] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * values[i + 1] + (u3 - u2) * m1;
};
