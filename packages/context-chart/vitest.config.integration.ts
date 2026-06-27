import tsconfigPaths from "vite-tsconfig-paths";
import type { ViteUserConfig } from "vitest/config";

import { workspaceAliases } from "../../vitest.shared";

const config: ViteUserConfig = {
  plugins: [tsconfigPaths()],
  esbuild: {
    target: "es2020",
  },
  resolve: { alias: workspaceAliases },
  test: {
    setupFiles: ["./setupTests.ts"],
    fakeTimers: {
      toFake: undefined,
    },
    include: ["test/infrastructure/**/*.test.ts"],
    sequence: { concurrent: false },
  },
};

export default config;
