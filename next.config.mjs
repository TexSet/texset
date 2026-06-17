/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ship a self-contained server bundle so the Docker image stays small
  output: "standalone",

  experimental: {
    // better-sqlite3 is a native module, keep it out of the webpack bundle
    serverComponentsExternalPackages: ["better-sqlite3"],
    // don't reuse a cached dynamic page when navigating back, so the dashboard
    // always reflects projects you just created or deleted
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
