import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.private.blob.vercel-storage.com",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/user/presentation/**": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
