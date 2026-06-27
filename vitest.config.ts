import * as path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import type { ViteUserConfig } from "vitest/config";

const alias = (name: string) => {
  const target = process.env.TEST_DIST !== undefined ? "dist/dist/esm" : "src";
  return {
    [`${name}/test`]: path.join(__dirname, "packages", name, "test"),
    [`${name}`]: path.join(__dirname, "packages", name, target),
  };
};

const project = (name: string) => {
  return {
    plugins: [tsconfigPaths()],
    test: { name, root: `packages/${name}` },
  };
};

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: ViteUserConfig = {
  esbuild: {
    target: "es2020",
  },
  resolve: {
    conditions: ["source"],
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
    include: ["test/**/*.test.ts"],
    alias: {
      ...alias("api-auth"),
      ...alias("api-chart"),
      ...alias("client-web"),
      ...alias("context-chart"),
      ...alias("deployment"),
      ...alias("shared"),
    },
  },
};

export default config;
