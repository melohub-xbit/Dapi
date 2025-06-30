import type { NextConfig } from "next";

const nextConfig = {
    typescript: {
        // ✅ Skip type-checking during build
        ignoreBuildErrors: true,
    },
};
export default nextConfig;
