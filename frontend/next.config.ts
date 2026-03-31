import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "bcryptjs", "jsonwebtoken"],
};

export default nextConfig;
