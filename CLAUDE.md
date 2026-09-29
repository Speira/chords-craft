# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
pnpm build:watch       # Watch mode

# Quality gate: format:check -> lint -> typecheck -> knip -> tests
pnpm check
pnpm typecheck         # tsc --noEmit in every package
pnpm knip              # unused files, exports and dependencies

# Run all tests
pnpm test
pnpm test --run        # Run once (no watch)
pnpm coverage          # With coverage report

# Run tests for a specific package
pnpm test packages/context-chart
pnpm test -- <pattern> # Filter by file/test name

# Lint & format
pnpm lint
pnpm lint:fix
pnpm format            # Prettier write + ESLint fix

# Code generation (barrel files, etc.)
pnpm codegen

# Clean build artifacts
pnpm clean
```

## Architecture

**pnpm workspaces monorepo** — all packages live under `packages/`.

### Package Map

| Package         | Role                                                |
| --------------- | --------------------------------------------------- |
| `shared`        | Cross-cutting value objects, utilities              |
| `context-chart` | Core DDD bounded context for charts                 |
| `context-band`  | Bounded context for bands — scaffolded, not started |
| `context-user`  | Bounded context for users — scaffolded, not started |
| `api-chart`     | AWS Lambda handler wrapping chart GraphQL resolvers |
| `api-auth`      | Lambda authorizer (Clerk integration)               |
| `client-web`    | Next.js 16 + React 19 web app                       |
| `deployment`    | AWS CDK infrastructure stack                        |

`context-band` and `context-user` contain only their build setup and a single value-object
stub. They are listed in `knip.jsonc` as known-unused until the contexts are designed.

### Domain Architecture (`context-chart`)

Follows strict DDD layering:

- **`domain/`** — entities, aggregates, events, repository/projection interfaces, value objects
- **`application/`** — command handlers, query handlers (all return `Effect<T, Error>`)
- **`infrastructure/`** — DynamoDB implementations (event store + read projection)
- **`interface/graphql/`** — AppSync resolver implementations + `schema.graphql`

### Data Model (DynamoDB single-table design)

Two tables:

1. **Event Store** (`charts_events`): `PK = CHART#{chartId}`, `SK = VERSION#{version}` — append-only event history
2. **Projection** (`charts_projection`): `PK = TENANT#{tenantId}`, `SK = CHART#{chartId}` — denormalized read model

### Effect TS Usage

The entire backend uses [Effect](https://effect.website/) for error handling and dependency injection:

- All domain methods and handlers return `Effect<T, E>` — no thrown exceptions
- Tests use `Effect.runPromise()` to evaluate Effect programs
- `@effect/vitest` provides Effect-aware test utilities
- Packages use Effect's `generateExports`/`generateIndex` for automatic barrel files

### Frontend (`client-web`)

Next.js App Router with:

- GraphQL via `graphql-request` → AWS AppSync
- Auth via Clerk (`@clerk/nextjs`)
- UI: Radix UI primitives + Tailwind CSS 4
- Forms: `react-hook-form` + `zod`
- Animations: Framer Motion; 3D: Three.js + React Three Fiber
- i18n: `next-intl`

### Infrastructure (`deployment`)

AWS CDK stack that combines chart context + API. Merges GraphQL schemas via `mergeSchemas.ts` before deploying AppSync.

## Key Patterns

Conventions follow the coding profile (`sass/coding-profile`, ADR-001 to ADR-005). The migration
status and what is still tracked as lint warnings are in MIGRATION.md.

- **Import ordering** (enforced by ESLint): `effect`/`react` → external → workspace
  (`@chordcraft/*`) → own package alias (`#context-chart/*`) → relative `./`
- **Aliases**: each package has its own `#<package>/*` alias for its `src/` (package.json
  `imports` + the root `tsconfig.base.json` paths). Another package is reached by its package
  name, never by a path. Relative imports are for siblings (`./`) only.
- **Type imports**: inline (`import { type A, B }`), or `import type` when every specifier is a type
- **Exports**: named only; default exports only where a framework requires them
- **Functions**: a file's exported functions are `function` declarations; arrows for callbacks,
  one-line helpers and typed handlers
- **Types**: `interface` for object shapes (no `I` prefix), `type` for unions; no `enum`, use
  `as const`; no `any`, use `unknown`
- **Naming**: PascalCase files for components and classes, camelCase for hooks and utils;
  UPPER_SNAKE constants; booleans prefixed `is/has/can/should/could/require`; boolean-returning
  functions prefixed `check`
- **Workspace dependencies**: use `workspace:*` protocol in `package.json`
- **Versioning**: Changesets (`pnpm changeset`) for semantic versioning of packages
- **Commits**: Conventional Commits; the lefthook hooks format, lint, and run typecheck + tests

## Testing

### Test Focus

Tests should verify **behavior**, not implementation details:

- ✅ **Do test**: Error propagation, validation rules, business logic
- ❌ **Don't test**: Console logging, internal function calls, debugging output

**Rationale**: Console logging is for observability in production, not a contract to maintain. Testing it makes tests fragile and couples them to implementation details.

### Vitest Configuration

- Tests live in `test/`, mirroring `src/`, and import through the package alias
  (`#context-chart/domain/Chart`)
- Files run in parallel; tests inside a file run in order. Opt into `describe.concurrent` only
  for I/O-bound suites without shared state
- Integration tests (`test/infrastructure/**`) need a local DynamoDB (`docker compose up`)
  and run via `pnpm test:integration`. They are their own vitest project named `integration`,
  which the default run excludes with `--project '!integration'`

## gstack

Use the /browse skill from gstack for all web browsing. Never use mcp**claude-in-chrome**\* tools.

Available skills:
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation,
/review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso,
/careful, /freeze, /guard, /unfreeze, /gstack-upgrade

If gstack skills aren't working, run: cd .claude/skills/gstack && ./setup

## Non-negotiable constraints

- update documentations (README.md, documentation/\*\*), after each impactful task to stay up to date in these documentations.
