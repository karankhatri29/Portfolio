import type { MetadataRoute } from "next";

import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Karan Khatri",
    description: "Portfolio of an AI engineer: NLP, knowledge graphs and applied AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#131918",
    theme_color: "#131918",
    icons: [
      { src: "/brand/k3/logo-k3-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/k3/logo-k3-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/k3/logo-k3.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
