import type { NextConfig } from "next";

const clerkEnvKeys = Object.keys(process.env)
  .filter((key) => key.toUpperCase().includes("CLERK"))
  .sort();
console.log(`[markai-clerk-env] ${clerkEnvKeys.length ? clerkEnvKeys.join(",") : "none"}`);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
