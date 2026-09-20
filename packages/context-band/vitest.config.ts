import * as path from 'node:path';
import type { ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = {
  esbuild: {
    target: 'es2020',
  },
  test: {
    setupFiles: [path.join(__dirname, 'setupTests.ts')],
    include: ['test/**/*.test.ts'],
  },
};

export default config;
