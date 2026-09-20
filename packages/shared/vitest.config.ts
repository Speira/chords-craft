import * as path from 'node:path';
import type { ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = {
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    exclude: ['bun:sqlite'],
  },
  test: {
    setupFiles: [path.join(__dirname, 'setupTests.ts')],
    sequence: {
      concurrent: true,
    },
    include: ['test/**/*.test.ts'],
    alias: {
      '#shared/*': './src/',
    },
  },
};

export default config;
