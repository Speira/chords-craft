import * as path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import type { ViteUserConfig } from "vitest/config";

import { workspaceAliases } from "./vitest.shared";

const project = (name: string) => ({
  plugins: [tsconfigPaths()],
  resolve: { alias: workspaceAliases },
  test: { name, root: `packages/${name}` },
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
    projects: [project("shared"), project("context-chart")],
  },
};

export default config;
