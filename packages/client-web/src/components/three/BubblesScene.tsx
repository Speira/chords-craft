"use client";

import { Environment } from "@react-three/drei";

import { BubbleEntity } from "./BubbleEntity";
import { CanvasLayer } from "./CanvasLayer";

export default function BubblesScene() {
  return (
    <CanvasLayer>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 3]} intensity={1.0} />
      <directionalLight position={[-6, 2, -2]} intensity={0.35} />

      <group position={[1, 0, 0]}>
        <BubbleEntity
          position={[0.8, -0.2, 0]}
          radius={0.55}
          color="#4F6579"
          speed={0.45}
          phase={0.1}
        />
        <BubbleEntity
          position={[-0.2, -0.6, 0.1]}
          radius={0.38}
          color="#EEDCCB"
          speed={0.65}
          phase={1.3}
        />
        <BubbleEntity
          position={[0.1, 0.35, -0.05]}
          radius={0.33}
          color="#F6DDF0"
          speed={0.55}
          phase={2.2}
        />
      </group>

      <Environment preset="city" />
    </CanvasLayer>
  );
}
