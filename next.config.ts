import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/cosmeticos/kits',
        destination: '/cosmeticos?categoria=Kits',
        permanent: true,
      },
      {
        // Temporal mientras los suplementos estén pausados (lib/tienda.ts)
        source: '/suplementos/kits',
        destination: '/cosmeticos',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;