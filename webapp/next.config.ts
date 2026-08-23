import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules it actually needs, so the runtime image does not have to carry
  // the full dependency tree.
  output: "standalone",
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Image uploads go through a server action, and the default cap is 1MB -
      // a larger photo is rejected by Next before the action runs, so the
      // action's own size check never gets a chance to explain why.
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
