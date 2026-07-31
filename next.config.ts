import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
