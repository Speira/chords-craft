import * as path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, type ViteUserConfig } from 'vitest/config';

import { workspaceAliases } from './vitest.shared';

const project = (name: string) => ({
  plugins: [tsconfigPaths()],
  resolve: { alias: workspaceAliases },
  test: {
    name,
    root: `packages/${name}`,
    // Integration tests (test/infrastructure/**) need a local DynamoDB and run
    // only via  `test:integration` script, never in the default suite.
    exclude: [...configDefaults.exclude, 'test/infrastructure/**'],
  },
});

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: ViteUserConfig = {
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    exclude: ['bun:sqlite'],
  },
  test: {
    setupFiles: [path.join(__dirname, 'setupTests.ts')],
    fakeTimers: {
      toFake: undefined,
    },
    // Files already run in parallel. Tests inside a file stay sequential: since Vitest 5,
    // `sequence.concurrent` also makes assertions on shared per-suite state unreliable
    // (and the global `expect` is not safe in concurrent tests). Opt in per suite with
    // `describe.concurrent` where a suite is I/O bound and has no shared state.
    projects: [
      project('api-auth'),
      project('api-chart'),
      project('context-chart'),
      project('shared'),
    ],
  },
};

export default config;
