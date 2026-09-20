# Coding-profile migration

Started 2026-09-20 on `chore/adopt-coding-profile`, from the template in
`sass/coding-profile/template` (ADR-001 to ADR-005 in `sass/shared-AI/adr`).

`pnpm check` is green: format, lint (0 errors, 259 warnings), types, knip and 345 tests.

What is left is tracked, not hidden:

- **Lint**: the `chordcraft/migration-debt` blocks at the end of `eslint.config.ts` downgrade
  the rules the code does not satisfy yet, with a count each. Delete an entry when its count
  reaches zero, and the blocks when the list is empty.
- **Dead code**: `knip.jsonc` lists the unused files and dependencies under `ignore` /
  `ignoreDependencies`, each with a reason; unused _exports_ are reported as warnings. Anything
  newly unused still fails the gate.

## Done

- ESLint 9 → 10 (flat config in TypeScript, type-aware, import-x, unicorn, @eslint-react),
  TypeScript 5.6 → 6.0, Vitest → 5, pnpm 10 → 11, Prettier 3.9 as `prettier.config.ts`.
- knip, lefthook hooks (format/lint staged, Conventional Commits, typecheck + tests on push),
  the CI workflows and Dependabot.
- Reformatted to single quotes / 100 columns (`.git-blame-ignore-revs` covers that commit;
  run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once per clone).
- Scope renamed to `@chordcraft/*`, so package roles can be matched by pattern.
- `~/*` replaced by one alias per package (`#context-chart/*`), declared in each
  `package.json` `imports` and in the root `tsconfig.base.json` `paths`.
- Tests and the vitest configs are part of the TypeScript programs, so they are type-checked
  and lintable with type information. The build configs exclude them from emit.
- Vitest 5: `describe.sequential` → `{ concurrent: false }`, constructor mocks need a
  `function`, and the global `sequence.concurrent` is gone (it made a resolver test observe
  another test's mock).
- File and interface naming: `useMobile.ts`, `nextIntl/`, `ChordsChartStack.ts`, and
  `IButton`/`IHeader`/… → `ButtonProps`/`HeaderProps`/…

## Deviations from the template (deliberate)

- **Packages are not source-first.** `exports` still point at `./build`, because the CDK ships
  `packages/api-*/build` as the Lambda code asset (`lambda.Code.fromAsset`, no bundler). Going
  source-first means bundling the lambdas first (esbuild/`NodejsFunction`), which is its own
  task. `pnpm build` stays part of the deploy path.
- **`noUncheckedIndexedAccess` is `false`** in `tsconfig.base.json` (the template has it on).
  Turning it on surfaces ~30 "possibly undefined" errors, mostly in the chart aggregate.
- **React packages** relax `exactOptionalPropertyTypes` and `noUncheckedSideEffectImports`
  (Radix/React optional props, CSS side-effect imports). This is also the template's default
  for `tsconfig.react.json` / `tsconfig.next.json`.

## Remaining work (259 warnings)

| Package                                 | Warnings | Main themes                                                                                                 |
| --------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `client-web`                            | 139      | unsafe `any` from graphql-request, unnecessary conditions, `console` → `Logger`, React context/effect rules |
| `deployment`                            | 53       | unsafe `any` from CDK/`mergeSchemas`, `console`, naming                                                     |
| `shared`                                | 45       | `vitest/no-conditional-expect` in the value-object tests, top-level arrows                                  |
| `context-chart`                         | 17       | top-level arrows in resolvers, `no-conditional-expect`, type-argument noise                                 |
| `api-auth`, `api-chart`, `context-user` | 5        | top-level arrows, a default export                                                                          |

Suggested order, one PR per package:

1. `shared` and `context-chart` (smallest, backend rules only).
   - Replace `if (Either.isLeft(result)) expect(...)` with an assertion on the whole `Either`,
     which is what `vitest/no-conditional-expect` is pointing at.
   - Turn exported top-level `const fn = () => { … }` into `function fn() { … }` (21 across the
     repo; one-line expression helpers are fine as they are).
2. `deployment` and the `api-*` packages.
   - Type `mergeSchemas` and the CDK glue instead of letting `any` flow.
   - Route `console` through a logger.
3. `client-web` (largest).
   - Type the graphql-request responses (a generated client would remove most of the unsafe
     warnings at once).
   - `console` → `#client-web/lib/logger`.
   - `@eslint-react/no-context-provider` and `no-use-context`: React 19 lets you render
     `<Context>` directly and use `use(Context)`.
   - `react-hooks/set-state-in-effect`: derive during render instead.
4. Then turn on `noUncheckedIndexedAccess` and fix the fallout.
5. Delete the `chordcraft/migration-debt` blocks.

## Dead code knip found (parked in knip.jsonc)

- `client-web/src/components/three/**`: a 3D scene that is never mounted, plus the deps it
  pulls in (`three`, `@react-three/*`, `@types/three`). Wire it up or delete both.
- `context-band` and `context-user`: scaffolding for contexts that have not been started.
- `client-web/src/types.ts`, and 11 unused exports/types (`GlobalError`, `useGetChart`,
  `useListCharts`, `toDarkMode`/`toLightMode`/`toggleMode`, `RoleConstruct`, …).
- Unused dependencies worth a look: `@clerk/themes`, `@hookform/resolvers`, `zod` and
  `framer-motion` in `client-web`, and `eslint-config-next`, now that the client has no ESLint
  config of its own.

## Not done, decide separately

- **Source-first packages + bundled lambdas** (see deviations above).
- **CI**: `check.yml` and `pr-title.yml` pass on PR #1. `snapshot.yml` was deleted: it published
  per-PR previews through pkg-pr-new, whose GitHub App is not installed on the repo, and every
  package here is private. `deploy.yml` is untouched.
- **Branch protection**: enable squash-merge only, and make the check jobs and the PR-title
  check required on `main`.
- **`pnpm-workspace.yaml` catalog**: dependency versions are still per package; the template
  centralises them under `catalog:`.
