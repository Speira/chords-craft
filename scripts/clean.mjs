import * as Glob from "glob";
import * as Fs from "node:fs";

const dirs = [".", ...Glob.sync("packages/*/")];

dirs.forEach((pkg) => {
  const files = ["tsconfig.build.tsbuildinfo", "build", "dist", "coverage", ".next"];

  files.forEach((file) => {
    Fs.rmSync(`${pkg}/${file}`, { recursive: true, force: true }, () => {});
  });
});
