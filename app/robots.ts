import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/workspace",
          "/projects",
          "/sign-in",
          "/sign-up",
          "/api/",
        ],
      },
    ],
    sitemap: "https://foundary.aurahub.dev/sitemap.xml",
    host: "https://foundary.aurahub.dev",
  };
}