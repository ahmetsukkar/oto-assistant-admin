const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.VERCEL === "1", // ← disable on Vercel, use committed sw.js
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withPWA(nextConfig);