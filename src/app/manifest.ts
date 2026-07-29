import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TwoATech OS",
    short_name: "TwoATech OS",
    description: "Gestão de assistência técnica especializada em computadores.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    lang: "pt-BR",
  };
}
