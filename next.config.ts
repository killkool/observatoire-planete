import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: ["maplibre-gl"],
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
