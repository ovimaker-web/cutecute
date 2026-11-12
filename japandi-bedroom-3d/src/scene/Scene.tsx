import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { PHASES, progress } from "../timeline";
import { Furniture } from "./Furniture";
import { ProceduralEnvironment, ShadowSetter, spline } from "./helpers";
import { PALETTE } from "./materials";
import { Ceiling, Shell, WallFeatures, WoodFloor } from "./Room";

/* ------------------------------------------------------------------ */
/* Kamera sinematik: keyframe sferis (azimuth, elevasi, jarak, target)  */
/* azimuth 45° = sudut isometrik klasik                                 */
/* ------------------------------------------------------------------ */
const KEYS = {
  //      frame:  0     120   240   330   420   510   620   720   790   860   900
  t: [0, 120, 240, 330, 420, 510, 620, 720, 790, 860, 900],
  az: [58, 45, 38, 44, 50, 45, 42, 45, 74, 20, 30],
  el: [40, 34, 29, 26, 23, 31, 30, 31, 23, 25, 30],
  dist: [31, 26.5, 23.5, 23, 23.5, 26.5, 25.5, 25.5, 23.5, 23.5, 26],
  tx: [0, 0, -0.2, 0.1, -0.1, 0, 0.1, 0, 0.2, -0.3, 0],
  ty: [0.75, 0.75, 0.95, 1.1, 1.2, 0.8, 0.8, 0.8, 0.95, 0.95, 0.8],
  tz: [0, 0, -0.5, -0.7, -0.4, -0.2, -0.3, -0.2, -0.4, 0.0, -0.1],
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const f = (k: keyof typeof KEYS) => spline(KEYS.t, KEYS[k], frame);
    const az = THREE.MathUtils.degToRad(f("az"));
    const el = THREE.MathUtils.degToRad(f("el"));
    const d = f("dist");
    const target = new THREE.Vector3(f("tx"), f("ty"), f("tz"));
    camera.position.set(
      target.x + d * Math.cos(el) * Math.cos(az),
      target.y + d * Math.sin(el),
      target.z + d * Math.cos(el) * Math.sin(az),
    );
    camera.fov = 27;
    camera.near = 1;
    camera.far = 80;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

/* ------------------------------------------------------------------ */
/* Pencahayaan: matahari lembut + LED hangat yang menyala di fase 4     */
/* ------------------------------------------------------------------ */
const Lights: React.FC = () => {
  const frame = useCurrentFrame();
  const led = progress(frame, PHASES.ceiling.from + 40, 50);
  const mood = progress(frame, PHASES.ceiling.from + 30, 60); // suasana menghangat
  const sunColor = new THREE.Color("#fff3e3").lerp(new THREE.Color("#ffe2bd"), mood);
  return (
    <>
      <hemisphereLight args={["#fff7ee", "#cdb9a0", 0.9 - mood * 0.3]} />
      <directionalLight
        position={[5.5, 9, 6.5]}
        intensity={2.6 - mood * 0.7}
        color={sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={6}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      {/* wall-washer LED di belakang bulkhead */}
      {[-1.5, -0.5, 0.5, 1.5].map((x) => (
        <pointLight key={`b${x}`} position={[x, 2.3, -1.8]} color={PALETTE.warmLight} intensity={led * 2.2} distance={3.2} decay={2} />
      ))}
      {[-1.0, 0.2, 1.4].map((z) => (
        <pointLight key={`l${z}`} position={[-1.8, 2.3, z]} color={PALETTE.warmLight} intensity={led * 1.8} distance={3} decay={2} />
      ))}
      {/* cahaya dari lampu gantung */}
      {[-0.78, 1.58].map((x) => (
        <pointLight key={`p${x}`} position={[x, 1.4, -1.6]} color={PALETTE.warmLight} intensity={led * 1.4} distance={2.5} decay={2} />
      ))}
      {/* backlight arch */}
      <pointLight position={[0.4, 1.2, -1.75]} color={PALETTE.warmLight} intensity={led * 1.6} distance={2.6} decay={2} />
    </>
  );
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const envI = 0.55 - progress(frame, PHASES.ceiling.from + 30, 60) * 0.15;
  return (
    <>
      <ProceduralEnvironment intensity={envI} />
      <CameraRig />
      <Lights />
      <Shell />
      <WoodFloor />
      <WallFeatures />
      <Ceiling />
      <Furniture />
      <ShadowSetter />
    </>
  );
};
