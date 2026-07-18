import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      // Bakancslista csatolmányok (PDF / hang / kép base64) miatt megemelve.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
