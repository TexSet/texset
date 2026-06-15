import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // needed for better-sqlite3 and child_process (xelatex compilation)
  serverExternalPackages: ["better-sqlite3"],

  env: {
    NEXT_PUBLIC_APP_NAME: "TexSet",
    NEXT_PUBLIC_APP_VERSION: "0.1.0",
  },
};

export default nextConfig;
