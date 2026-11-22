import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    // Story 10.11 – a már meglátogatott oldalra 30 mp-en belül visszalépve a kliens-gyorsítótárból
    // azonnal jön (a server actionök revalidatePath-ja ezt mentés után úgyis üríti).
    staleTimes: { dynamic: 30 },
    serverActions: {
      // Bakancslista csatolmányok (PDF / hang / kép base64) miatt megemelve.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
