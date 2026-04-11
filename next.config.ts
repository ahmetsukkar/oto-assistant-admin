import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// next-pwa doesn't have Next.js 15 compatible types — use require with type cast
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig) as NextConfig;