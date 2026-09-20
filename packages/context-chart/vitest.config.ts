import { workspaceAliases } from '../../vitest.shared';
import tsconfigPaths from 'vite-tsconfig-paths';
import type { ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = {
  plugins: [tsconfigPaths()],
  esbuild: {
    target: 'es2020',
  },
  resolve: { alias: workspaceAliases },
  test: {
    setupFiles: ['./setupTests.ts'],
    include: ['test/**/*.test.ts'],
    exclude: ['test/infrastructure/**/*.test.ts'],
  },
};

export default config;
