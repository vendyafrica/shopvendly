import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["@shopvendly/ui", "@shopvendly/auth"],
  outputFileTracingRoot: repoRoot,
  allowedDevOrigins: [
    "harmonically-carpetless-janna.ngrok-free.dev",
    "*.ngrok-free.dev",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mplsrodasp.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn-us.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ttwstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.cosmos.so",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.cosmos.so",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "momodeveloper.mtn.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
