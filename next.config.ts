import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: ["maplibre-gl"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1480]
  },
  async redirects() {
    return [
      {
        source: "/weather/france/:region/:department/:commune",
        destination: "/meteo/:region/:department/:commune",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
