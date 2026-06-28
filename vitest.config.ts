import * as path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, type ViteUserConfig } from "vitest/config";

import { workspaceAliases } from "./vitest.shared";

const project = (name: string, test: Record<string, unknown> = {}) => ({
  plugins: [tsconfigPaths()],
  resolve: { alias: workspaceAliases },
  test: { name, root: `packages/${name}`, ...test },
});

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: ViteUserConfig = {
  esbuild: {
    target: "es2020",
  },
  optimizeDeps: {
    exclude: ["bun:sqlite"],
  },
  test: {
    setupFiles: [path.join(__dirname, "setupTests.ts")],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: true,
    },
    projects: [
      project("shared"),
      // Integration tests (test/infrastructure/**) need a local DynamoDB and run
      // only via context-chart's `test:integration` script, never in the default suite.
      project("context-chart", {
        exclude: [...configDefaults.exclude, "test/infrastructure/**"],
      }),
      project("api-auth"),
      project("api-chart"),
    ],
  },
};

export default config;
