import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@noir-lang/noir_js",
    "@noir-lang/acvm_js", 
    "@noir-lang/noirc_abi",
    "@noir-lang/types",
    "@aztec/bb.js",
  ],
  outputFileTracingIncludes: {
    "/api/generate-proof": ["./scripts/**"],
    "/api/stamp-identity": ["./circuits/**"],
  },
};

export default nextConfig;
