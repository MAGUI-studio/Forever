import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // OpenNext selects jose's workerd export, while Next.js traces its Node export.
  // Include both possible npm locations so the Worker has the browser build too.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/jose/**/*",
      "./node_modules/jwks-rsa/node_modules/jose/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {protocol:"https",hostname:"firebasestorage.googleapis.com"},
      {protocol:"https",hostname:"gift-media.lejour.com.br"},
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "ufs.sh" },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
};

export default nextConfig;
