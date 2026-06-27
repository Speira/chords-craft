import tsconfigPaths from "vite-tsconfig-paths";
import type { ViteUserConfig } from "vitest/config";

const config: ViteUserConfig = {
  plugins: [tsconfigPaths()],
  esbuild: {
    target: "es2020",
  },
  resolve: {
    conditions: ["source"],
  },
  test: {
    setupFiles: ["./setupTests.ts"],
    fakeTimers: {
      toFake: undefined,
    },
    include: ["test/**/*.test.ts"],
  },
};

export default config;
