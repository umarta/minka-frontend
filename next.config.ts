import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media-storage.kame.co.id",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
