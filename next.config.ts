import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Payment screenshots are sent inside the form (resized in the browser first).
    serverActions: { bodySizeLimit: "3.5mb" },
  },
};

export default nextConfig;
