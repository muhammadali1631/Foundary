import { ImageResponse } from "next/og";
import OgArtwork from "@/components/OgArtwork";

export const runtime = "edge";
export const alt =
  "Foundary — AI App Builder. Turn a prompt into a living app.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(<OgArtwork />, {
    ...size,
  });
}