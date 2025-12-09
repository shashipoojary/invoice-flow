import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    unoptimized: true, // Disable for Vercel builds
  },
  
  // Force cache busting
  generateEtags: false,
  poweredByHeader: false,
};

export default nextConfig;
