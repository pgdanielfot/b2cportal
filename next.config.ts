import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Local-dev fallback path sends raw file bytes through the server
      // action (production uses direct-to-Blob upload instead, which
      // bypasses this limit entirely). Raise it so local testing with
      // real images/videos doesn't hit Next's 1MB default.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
