import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "zzceatzqueiqklympjco.supabase.co" }],
  },
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
