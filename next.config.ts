import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev",'192.168.1.103'],
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
