import type { NextConfig } from "next";

const API_URL = process.env.API_URL || "http://localhost:8787";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "192.168.50.70"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
