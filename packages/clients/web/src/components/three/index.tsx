"use client";

import dynamic from "next/dynamic";

const BubbleScene = dynamic(() => import("./BubblesScene"), { ssr: false });

export function BubbleAnimate() {
  return <BubbleScene />;
}
