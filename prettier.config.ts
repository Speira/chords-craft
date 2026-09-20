import type { Config } from 'prettier';

/** Tailwind v4 entry stylesheet of each front-end package (paths are relative to the repo root). */
const TAILWIND_STYLESHEETS: Record<string, string> = {
  'packages/client-web': 'packages/client-web/src/app/[locale]/globals.css',
};

const BASE_PLUGINS = ['prettier-plugin-packagejson', 'prettier-plugin-jsdoc'];

// Formatting only. Import order and code rules live in eslint.config.ts.
const config: Config = {
  arrowParens: 'always',
  bracketSameLine: true,
  endOfLine: 'lf',
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  plugins: BASE_PLUGINS,
  overrides: [
    {
      files: ['**/*.jsonc', '**/tsconfig*.json'],
      options: { trailingComma: 'none' },
    },
    // Tailwind class sorting for front-end packages (the tailwind plugin must stay last).
    ...Object.entries(TAILWIND_STYLESHEETS).map(([dir, stylesheet]) => ({
      files: [`${dir}/**/*.{ts,tsx,css}`],
      options: {
        plugins: [...BASE_PLUGINS, 'prettier-plugin-tailwindcss'],
        tailwindStylesheet: stylesheet,
        tailwindFunctions: ['cn', 'cva', 'clsx'],
      },
    })),
  ],
};

export default config;
