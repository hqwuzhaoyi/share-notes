import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses this project as root (avoids multi-lockfile mis-detection)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
