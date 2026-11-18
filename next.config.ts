import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Excel imports are uploaded through a Server Action.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  // This app is entirely session-gated and dynamic, so Cache Components /
  // Partial Prerendering is not enabled for now.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
