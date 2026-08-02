import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The libSQL client resolves a native binding per platform. Bundling it
  // breaks that resolution, so it has to stay external on the server.
  serverExternalPackages: ['@libsql/client', 'libsql'],
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
