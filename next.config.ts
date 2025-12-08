import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    unoptimized: true, // Disable for Vercel builds
  },
  
  // Disable Turbopack for now to avoid font issues
  experimental: {
    // turbo: false, // Removed - this was causing the warning
  },
  
  // Force cache busting
  generateEtags: false,
  poweredByHeader: false,
  
  // Set workspace root to avoid lockfile detection issues
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
