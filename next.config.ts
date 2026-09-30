import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dfinity/agent",
    "@dfinity/auth-client",
    "@dfinity/candid",
    "@dfinity/identity",
    "@dfinity/principal",
  ],
};

export default nextConfig;
