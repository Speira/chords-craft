import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

const withNextIntl = createNextIntlPlugin('./src/lib/nextIntl/request.ts');
export default withNextIntl(nextConfig);
