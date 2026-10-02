import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dfinity/agent",
    "@dfinity/auth-client",
    "@dfinity/candid",
    "@dfinity/identity",
    "@dfinity/principal",
    "three",
    "@react-three/fiber",
    "@react-three/drei",
  ],
};

export default nextConfig;
