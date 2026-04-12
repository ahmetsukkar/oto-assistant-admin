const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: false,
  register: true,
  skipWaiting: true,
  customWorkerSrc: "sw-custom.js",  // must match exactly
  customWorkerDest: "public",
  customWorkerPrefix: "sw",
  workboxOptions: {
    disableDevLogs: true,
  },
});