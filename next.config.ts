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
  // The headless Chrome binary is only bundled into the functions listed here,
  // and every route that renders a slide thumbnail needs it: the editor, and
  // the MCP endpoint that chatbots write slides through.
  outputFileTracingIncludes: {
    "/user/presentation/**": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/api/mcp": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
