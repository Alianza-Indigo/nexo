import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXO — Coordinador de Crisis",
    short_name: "NEXO",
    description: "Apoyo paso a paso para cuidadores durante una crisis.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7f5",
    theme_color: "#176b5b",
    orientation: "any",
    categories: ["health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [{ name: "Necesito ayuda ahora", short_name: "Ayuda ahora", url: "/crisis", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] }]
  };
}
