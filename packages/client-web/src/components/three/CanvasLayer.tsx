'use client';

import { Canvas } from '@react-three/fiber';
import type { ReactNode } from 'react';

export function CanvasLayer({ children }: { children: ReactNode }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 3.2], fov: 45 }}>
      {children}
    </Canvas>
  );
}
