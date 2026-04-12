// scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "fs/promises";

await mkdir("public/icons", { recursive: true });

// Dark slate background + white wrench SVG
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#0f172a"/>
  <text x="50" y="68" font-size="55" text-anchor="middle" fill="white">🔧</text>
</svg>`;

const svgBuffer = Buffer.from(svgIcon);

await sharp(svgBuffer).resize(192, 192).png().toFile("public/icons/icon-192x192.png");
await sharp(svgBuffer).resize(512, 512).png().toFile("public/icons/icon-512x512.png");

console.log("✅ Icons generated: public/icons/icon-192x192.png and icon-512x512.png");