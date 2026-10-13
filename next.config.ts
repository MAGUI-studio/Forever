import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {protocol:"https",hostname:"firebasestorage.googleapis.com"},
      {protocol:"https",hostname:"gift-media.lejour.com.br"},
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
