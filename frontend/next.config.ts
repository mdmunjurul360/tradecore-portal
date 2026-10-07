import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Pin the Turbopack workspace root to this app. The repo root contains a
  // legacy Vite project (package-lock.json + src/), which made Next infer the
  // wrong root and resolve app routes incorrectly after a dev-server restart.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*', // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
