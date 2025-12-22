import * as Glob from "glob";
import * as Fs from "node:fs";

const dirs = [
  ".",
  ...Glob.sync("packages/contexts/*/"),
  ...Glob.sync("packages/clients/*/"),
  ...Glob.sync("packages/deployment/"),
  ...Glob.sync("packages/shared/"),
];

dirs.forEach((pkg) => {
  const files = [".tsbuildinfo", "build", "dist", "coverage"];

  files.forEach((file) => {
    Fs.rmSync(`${pkg}/${file}`, { recursive: true, force: true }, () => {});
  });
});
