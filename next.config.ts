import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    unoptimized: true, // Disable for Vercel builds
  },
  
  // Disable Turbopack for now to avoid font issues
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
