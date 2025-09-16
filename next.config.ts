import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true, // Disable for Docker builds
  },
};

export default nextConfig;
