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
        source: '/suplementos/kits',
        destination: '/suplementos',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;