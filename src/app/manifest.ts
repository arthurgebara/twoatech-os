import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TwoATech OS",
    short_name: "TwoATech OS",
    description: "Gestão de assistência técnica especializada em computadores.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#011C26",
    theme_color: "#BFF205",
    lang: "pt-BR",
    icons: [
      {
        src: "/twoatech-logo.png",
        sizes: "99x99",
        type: "image/png",
      },
    ],
  };
}
