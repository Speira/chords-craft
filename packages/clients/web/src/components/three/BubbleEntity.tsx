"use client";

import { useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

export function BubbleEntity({
  color,
  phase = 0,
  position,
  radius,
  speed = 0.6,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  speed?: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;
    if (!ref.current) return;

    ref.current.position.y = position[1] + Math.sin(t) * 0.08;
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.15;
    ref.current.rotation.x = Math.cos(t * 0.25) * 0.08;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.05} />
    </mesh>
  );
}
