import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Scene } from "./scene/Scene";
import { Overlay } from "./ui/Overlay";

export const JapandiBedroom: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 45%, #f7f2ea 0%, #ece3d6 60%, #e0d4c4 100%)" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        camera={{ fov: 27, near: 1, far: 80, position: [14, 12, 14] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Scene />
      </ThreeCanvas>
      <Overlay />
    </AbsoluteFill>
  );
};
