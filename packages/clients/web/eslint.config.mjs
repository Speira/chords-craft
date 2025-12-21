import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sortDestructureKeys from "eslint-plugin-sort-destructure-keys";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "sort-destructure-keys": sortDestructureKeys,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["effect", "^react$"],
            ["^react", "^@?\\w"],
            ["^@telek-software", "@speira"],
            ["^~"],
            ["^\\u0000"],
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            ["^.+\\.?(css|scss)$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "sort-destructure-keys/sort-destructure-keys": "error",
      "@typescript-eslint/array-type": [
        "warn",
        {
          default: "generic",
          readonly: "generic",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },
]);

export default eslintConfig;
