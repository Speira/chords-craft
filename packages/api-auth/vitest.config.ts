import * as path from "node:path";
import type { ViteUserConfig } from "vitest/config";

const config: ViteUserConfig = {
  esbuild: {
    target: "es2020",
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  test: {
    setupFiles: [path.join(__dirname, "setupTests.ts")],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: true,
    },
    include: ["test/**/*.test.ts"],
  },
};

export default config;
