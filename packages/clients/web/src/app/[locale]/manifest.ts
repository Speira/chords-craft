import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chords Craft",
    short_name: "ChordCraft",
    description: "Create and share musical chord charts",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfdfd",
    theme_color: "#556e84",
    icons: [
      {
        src: "/favicon-android-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon-apple-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/favicon-pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon-pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
