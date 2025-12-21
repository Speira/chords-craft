import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "~": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./src/lib/next-intl/request.ts");
export default withNextIntl(nextConfig);
