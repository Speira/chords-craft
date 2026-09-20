/**
 * Global ESLint config (ESLint 10, flat config) for a pnpm modular monolith.
 *
 * Layout assumed (ADR-002): packages/{shared,context,api,client,deployment}-* Formatting is
 * Prettier's job: this file only holds code-quality rules, and `eslint-config-prettier` is applied
 * last to switch off anything stylistic.
 */
import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';
import vitest from '@vitest/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ---------------------------------------------------------------------------
// Project settings
// ---------------------------------------------------------------------------

/** Npm scope of every workspace package: one scope per project (ADR-002), e.g. `@chordcraft`. */
const SCOPE = '@project';

/**
 * Front-end packages running Next.js, e.g. ['packages/client-web'] (others are treated as
 * Vite/React).
 */
const NEXT_APPS: Array<string> = [];

/** Enable when back-end packages are written with Effect (no `throw` in domain/application). */
const SHOULD_ENFORCE_EFFECT = false as boolean;

// ---------------------------------------------------------------------------
// File globs
// ---------------------------------------------------------------------------

const TS_FILES = ['**/*.{ts,tsx,mts,cts}'];
const JS_FILES = ['**/*.{js,mjs,cjs,jsx}'];
const REACT_FILES = ['packages/client-*/**/*.{ts,tsx}'];
const TEST_FILES = ['**/test/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'];
const CONFIG_FILES = [
  '*.config.{ts,mts,js,mjs}',
  '**/*.config.{ts,mts,js,mjs}',
  '**/*.config.*.{ts,mts,js,mjs}', // vitest.config.integration.ts, …
  '**/scripts/**',
];
/** Files a framework requires to `export default` (Next routes, configs, stories...). */
const DEFAULT_EXPORT_FILES = [
  ...CONFIG_FILES,
  '**/app/**/{page,layout,loading,error,global-error,not-found,template,default,route,manifest,sitemap,robots,opengraph-image,icon}.{ts,tsx}',
  '**/{middleware,proxy,instrumentation}.ts',
  '**/*.stories.tsx',
  '**/*.d.ts',
];
/** Framework or generator-owned file names that can't follow camelCase/PascalCase. */
const FILENAME_EXCEPTIONS = [
  '**/components/ui/**', // shadcn (kebab-case)
  '**/app/**', // Next.js App Router
  '**/routes/**', // TanStack Router
  '**/*.d.ts',
  ...CONFIG_FILES,
];

// ---------------------------------------------------------------------------
// Module boundaries (modular monolith), enforced with `no-restricted-imports`.
// Every block below re-declares the full rule, since flat config does not merge options.
// ---------------------------------------------------------------------------

type RestrictedPattern = { message: string } & ({ group: Array<string> } | { regex: string });

function pkg(role: string): string {
  return `${SCOPE}/${role}-*`;
}

const COMMON_PATTERNS: Array<RestrictedPattern> = [
  {
    regex: String.raw`^\.\./`,
    message:
      "Use the package's own `#<package>/` alias to cross directories; relative imports are for siblings (./) only.",
  },
  {
    group: [`${SCOPE}/*/src`, `${SCOPE}/*/src/**`],
    message: 'Import another package through its public `exports`, never through its /src.',
  },
];

const ROLE_PATTERNS: Record<string, Array<RestrictedPattern>> = {
  shared: [
    {
      group: [pkg('context'), pkg('api'), pkg('client'), pkg('deployment')],
      message: 'shared-* is the kernel: it may only depend on other shared-* packages.',
    },
  ],
  context: [
    {
      group: [pkg('context'), pkg('api'), pkg('client'), pkg('deployment')],
      message:
        'A bounded context only depends on shared-*. Talk to other contexts through events/contracts in shared-*, orchestrated by an api-*.',
    },
  ],
  api: [
    {
      group: [pkg('api'), pkg('client'), pkg('deployment')],
      message: 'api-* may only depend on context-* and shared-*.',
    },
  ],
  client: [
    {
      group: [pkg('context'), pkg('api'), pkg('deployment')],
      message: 'Front-ends talk to the back-end over the network; only shared-* can be imported.',
    },
  ],
  deployment: [
    {
      group: [pkg('client')],
      message: 'Infrastructure must not depend on front-end code.',
    },
  ],
};

/** DDD layering inside a context package (`#<package>/` = that package's own src). */
const LAYER_PATTERNS: Record<string, Array<RestrictedPattern>> = {
  domain: [
    {
      // `regex`, not `group`: a leading `#` is a comment in gitignore-style patterns.
      regex: String.raw`^#[\w-]+/(application|infrastructure|interface)(/|$)`,
      message:
        'The domain layer is pure: it cannot depend on application, infrastructure or interface.',
    },
    {
      group: [
        '@aws-sdk/*',
        'better-sqlite3',
        'pg',
        'mongoose',
        'mongodb',
        'express',
        'graphql',
        'react',
        'next',
        'next/*',
      ],
      message:
        'No I/O or framework libraries in the domain: declare a port (interface + Tag) instead.',
    },
  ],
  application: [
    {
      regex: String.raw`^#[\w-]+/(infrastructure|interface)(/|$)`,
      message: 'Application depends on domain ports only; infrastructure is wired at the edge.',
    },
  ],
  infrastructure: [
    {
      regex: String.raw`^#[\w-]+/interface(/|$)`,
      message: 'Infrastructure implements domain ports; it never reaches the interface layer.',
    },
  ],
};

function restrictImports(...patterns: Array<Array<RestrictedPattern>>) {
  return {
    'no-restricted-imports': ['error', { patterns: [...COMMON_PATTERNS, ...patterns.flat()] }],
  } as const;
}

// ---------------------------------------------------------------------------
// Shared rule sets
// ---------------------------------------------------------------------------

const RESTRICTED_SYNTAX = [
  {
    selector: "CallExpression[callee.property.name='push'] > SpreadElement.arguments",
    message: 'Do not use spread arguments in Array.push (stack overflow on large arrays).',
  },
  {
    // The file's exported functions are declarations (hoisted, named in stack traces). Arrows stay
    // fine for callbacks, local helpers, one-line expression helpers
    // (`export const checkIsSharp = (n: Note) => n.includes(SHARP);`) and typed handlers
    // (`export const handler: Handler = async () => {}`).
    selector:
      "Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator:not([id.typeAnnotation]) > ArrowFunctionExpression[body.type='BlockStatement']",
    message: 'Declare exported functions with `function name() {}` instead of a const arrow.',
  },
  {
    selector: 'TSEnumDeclaration',
    message: 'Use an `as const` object + `(typeof X)[keyof typeof X]` union instead of an enum.',
  },
];

const EFFECT_RESTRICTED_SYNTAX = [
  ...RESTRICTED_SYNTAX,
  {
    selector: 'ThrowStatement',
    message: 'Domain/application code never throws: return `Effect.fail(new XxxError(...))`.',
  },
];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export default defineConfig(
  globalIgnores([
    '**/dist/',
    '**/build/',
    '**/coverage/',
    '**/.next/',
    '**/out/',
    '**/cdk.out/',
    '**/generated/',
    '**/*.gen.ts',
    '**/next-env.d.ts',
  ]),

  // --- Base: every JS/TS file -------------------------------------------------
  {
    name: 'speira/base',
    files: [...TS_FILES, ...JS_FILES],
    extends: [js.configs.recommended],
    plugins: {
      'import-x': importX,
      'simple-import-sort': simpleImportSort,
      'sort-destructure-keys': sortDestructureKeys,
      unicorn,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    rules: {
      // Core (ADR-003)
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'max-lines-per-function': [
        'warn',
        { max: 200, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'multi-line'],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-nested-ternary': 'warn',
      'no-param-reassign': ['error', { props: false }],
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX],
      // No `const f = function () {}`; top-level arrows are handled by no-restricted-syntax above.
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],

      // Imports: effect/react → external → workspace → #<package>/ internal → side effects → relative → styles
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^effect', '^react$', '^react-dom'],
            ['^node:', '^@?\\w'],
            [`^${SCOPE.replace('/', '\\/')}/`],
            ['^#'],
            ['^\\u0000'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
      'import-x/no-self-import': 'error',
      'import-x/no-relative-packages': 'error',
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
      'import-x/no-default-export': 'error',
      'import-x/no-mutable-exports': 'error',

      'sort-destructure-keys/sort-destructure-keys': 'error',

      // Unicorn: a curated subset, not the whole opinionated preset
      // ADR-004: camelCase (hooks, utils) or PascalCase (components, classes), folders included.
      'unicorn/filename-case': [
        'error',
        {
          cases: { camelCase: true, pascalCase: true },
          // Package folders follow ADR-002 (kebab `context-chart`); check what is inside them.
          directoryRoots: [/^packages\/[^/]+$/],
          // Keep acronyms upper-case in PascalCase names: TenantID.ts, DynamoDBChartRepository.ts
          ignore: [/^[A-Z][\dA-Za-z]*[A-Z]{2}[\dA-Za-z]*(\.[a-z]+)*\.tsx?$/],
        },
      ],
      'unicorn/prefer-switch': [
        'error',
        { minimumCases: 6, emptyDefaultCase: 'do-nothing-comment' },
      ],
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-useless-spread': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
    },
  },

  // --- TypeScript (type-aware) ----------------------------------------------
  {
    name: 'speira/typescript',
    files: TS_FILES,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'generic', readonly: 'generic' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],
      // With inline type imports + verbatimModuleSyntax, a type-only import must be top-level.
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 5 },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Static-only classes are the house style for helpers (ObjectUtils, PatientCreateHelper).
      '@typescript-eslint/no-extraneous-class': ['error', { allowStaticOnly: true }],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],

      // Naming (ADR-004)
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'import', format: null },
        {
          // PascalCase: React components, Effect Tags/Layers/Schemas. UPPER_CASE: constants.
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        {
          // DB columns (snake_case), HTTP headers, GraphQL payloads...
          selector: ['objectLiteralProperty', 'typeProperty', 'objectLiteralMethod'],
          format: null,
        },
        {
          selector: 'classProperty',
          modifiers: ['static', 'readonly'],
          format: ['camelCase', 'UPPER_CASE'],
        },
        {
          selector: 'variable',
          types: ['boolean'],
          modifiers: ['destructured'],
          format: null,
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase', 'UPPER_CASE'],
          prefix: [
            'is',
            'has',
            'can',
            'should',
            'could',
            'require',
            'IS_',
            'HAS_',
            'CAN_',
            'SHOULD_',
          ],
        },
      ],
    },
  },

  // Plain JS files (configs, scripts): no type information.
  {
    name: 'speira/javascript',
    files: JS_FILES,
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    name: 'speira/default-exports',
    files: DEFAULT_EXPORT_FILES,
    rules: { 'import-x/no-default-export': 'off' },
  },
  {
    // shadcn components are generated and re-generated by the CLI: keep them compiling and
    // readable, but don't hold vendored code to the house rules.
    name: 'speira/generated-ui',
    files: ['**/components/ui/**'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'no-restricted-syntax': 'off',
      'no-restricted-imports': 'off',
    },
  },
  {
    name: 'speira/filename-exceptions',
    files: FILENAME_EXCEPTIONS,
    rules: { 'unicorn/filename-case': 'off' },
  },

  // --- React (Vite & Next clients) ------------------------------------------
  {
    name: 'speira/react',
    files: REACT_FILES,
    extends: [
      eslintReact.configs['recommended-type-checked'],
      reactHooks.configs.flat['recommended-latest'],
    ],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  ...NEXT_APPS.map((dir) => ({
    name: `speira/next:${dir}`,
    files: [`${dir}/**/*.{ts,tsx}`],
    plugins: { '@next/next': nextPlugin },
    settings: { next: { rootDir: `${dir}/` } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  })),

  // --- Module boundaries ------------------------------------------------------
  {
    name: 'speira/boundaries:shared',
    files: ['packages/shared-*/**'],
    rules: restrictImports(ROLE_PATTERNS.shared),
  },
  {
    name: 'speira/boundaries:context',
    files: ['packages/context-*/**'],
    rules: restrictImports(ROLE_PATTERNS.context),
  },
  ...(['domain', 'application', 'infrastructure'] as const).map((layer) => ({
    name: `speira/boundaries:context-${layer}`,
    files: [`packages/context-*/src/${layer}/**`],
    rules: restrictImports(ROLE_PATTERNS.context, LAYER_PATTERNS[layer]),
  })),
  {
    name: 'speira/boundaries:api',
    files: ['packages/api-*/**'],
    rules: restrictImports(ROLE_PATTERNS.api),
  },
  {
    name: 'speira/boundaries:client',
    files: ['packages/client-*/**'],
    rules: restrictImports(ROLE_PATTERNS.client),
  },
  {
    name: 'speira/boundaries:deployment',
    files: ['packages/deployment-*/**'],
    rules: restrictImports(ROLE_PATTERNS.deployment),
  },

  // --- Effect (opt-in) ----------------------------------------------------------
  ...(SHOULD_ENFORCE_EFFECT
    ? [
        {
          name: 'speira/effect',
          files: ['packages/context-*/src/{domain,application}/**/*.ts'],
          rules: { 'no-restricted-syntax': ['error', ...EFFECT_RESTRICTED_SYNTAX] },
        },
      ]
    : []),

  // --- Tests (mirrored test/ folders) -------------------------------------------
  {
    name: 'speira/tests',
    files: TEST_FILES,
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/prefer-hooks-in-order': 'error',
      'max-lines-per-function': 'off',
      // Test doubles: empty stubs and fixture classes are the point.
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  {
    // MIGRATION DEBT — see MIGRATION.md.
    // Rules the codebase does not satisfy yet, downgraded to warnings so the gate stays green
    // while they are worked off package by package. Counts are from 2026-09-20: delete an entry
    // once its count reaches zero, and delete these blocks when the list is empty.
    name: 'chordcraft/migration-debt',
    files: ['packages/**/*.{ts,tsx}'],
    ignores: CONFIG_FILES, // those run without type information
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'warn', // 25
      'no-restricted-syntax': 'warn', // 21
      '@typescript-eslint/no-unsafe-member-access': 'warn', // 20
      '@typescript-eslint/no-empty-function': 'warn', // 18
      '@typescript-eslint/no-unsafe-call': 'warn', // 17
      '@typescript-eslint/no-unsafe-assignment': 'warn', // 15
      '@typescript-eslint/naming-convention': 'warn', // 14
      'no-console': 'warn', // 12
      '@typescript-eslint/no-unsafe-argument': 'warn', // 7
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // 7
      'import-x/no-default-export': 'warn', // 6
      '@typescript-eslint/no-explicit-any': 'warn', // 4
      '@typescript-eslint/no-unsafe-return': 'warn', // 4
      '@typescript-eslint/require-await': 'warn', // 4
      '@typescript-eslint/no-unnecessary-type-conversion': 'warn', // 3
      'func-style': 'warn', // 2
      'no-restricted-imports': 'warn', // 2
      '@typescript-eslint/no-base-to-string': 'warn', // 1
      '@typescript-eslint/no-floating-promises': 'warn', // 1
      '@typescript-eslint/no-misused-spread': 'warn', // 1
      '@typescript-eslint/no-unused-expressions': 'warn', // 1
      '@typescript-eslint/unbound-method': 'warn', // 1
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'warn', // 1
      eqeqeq: 'warn', // 1
      'no-param-reassign': 'warn', // 1
    },
  },
  {
    name: 'chordcraft/migration-debt:tests',
    files: TEST_FILES,
    plugins: { vitest },
    rules: {
      'vitest/no-conditional-expect': 'warn', // 22
      'vitest/expect-expect': 'warn', // 1
    },
  },
  {
    name: 'chordcraft/migration-debt:react',
    files: REACT_FILES,
    extends: [
      eslintReact.configs['recommended-type-checked'],
      reactHooks.configs.flat['recommended-latest'],
    ],
    rules: {
      '@eslint-react/no-context-provider': 'warn', // 3
      '@eslint-react/no-use-context': 'warn', // 3
      '@eslint-react/set-state-in-effect': 'warn', // 2
      'react-hooks/set-state-in-effect': 'warn', // 2
      '@eslint-react/dom-no-dangerously-set-innerhtml': 'warn', // 1
      '@eslint-react/no-array-index-key': 'warn', // 1
      '@eslint-react/no-leaked-conditional-rendering': 'warn', // 1
      '@eslint-react/purity': 'warn', // 1
      '@eslint-react/use-state': 'warn', // 1
      'react-hooks/purity': 'warn', // 1
    },
  },
  // --- Scripts & config files -----------------------------------------------
  {
    name: 'speira/scripts',
    files: CONFIG_FILES,
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      'no-console': 'off',
      // A config file at a package root legitimately reaches the repo root for shared tooling.
      'no-restricted-imports': 'off',
      'import-x/no-relative-packages': 'off',
    },
  },

  // Must stay last: turns off every rule that conflicts with Prettier.
  prettier,
);
