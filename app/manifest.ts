import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foundary — AI App Builder",
    short_name: "Foundary",
    description:
      "Turn a prompt into a living app. Foundary's AI writes React + Tailwind code and renders a live preview in your browser.",
    id: "/",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0f0d",
    theme_color: "#0b0f0d",
    categories: ["developer", "productivity", "design"],
    icons: [
      {
        src: "/logo-short.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}