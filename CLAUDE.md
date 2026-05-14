# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
pnpm build:watch       # Watch mode

# Type checking (no emit)
pnpm check

# Run all tests
pnpm test
pnpm test --run        # Run once (no watch)
pnpm coverage          # With coverage report

# Run tests for a specific package
pnpm test packages/context-chart
pnpm test -- <pattern> # Filter by file/test name

# Lint & format
pnpm lint
pnpm lint-fix
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
| `api-chart`     | AWS Lambda handler wrapping chart GraphQL resolvers |
| `api-auth`      | Lambda authorizer (Clerk integration)               |
| `client-web`    | Next.js 16 + React 19 web app                       |
| `deployment`    | AWS CDK infrastructure stack                        |

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

- **Import ordering** (enforced by ESLint): `effect`/`react` → external → internal (`@speira/*`) → relative
- **Type imports**: always use `import type` for types
- **Workspace dependencies**: use `workspace:*` protocol in `package.json`
- **Versioning**: Changesets (`pnpm changeset`) for semantic versioning of packages

## Testing

### Test Focus

Tests should verify **behavior**, not implementation details:

- ✅ **Do test**: Error propagation, validation rules, business logic
- ❌ **Don't test**: Console logging, internal function calls, debugging output

**Rationale**: Console logging is for observability in production, not a contract to maintain. Testing it makes tests fragile and couples them to implementation details.

### Vitest Configuration

- Root config has `sequence: { concurrent: true }` for parallel test execution
- Tests run concurrently by default for better performance

## gstack

Use the /browse skill from gstack for all web browsing. Never use mcp**claude-in-chrome**\* tools.

Available skills:
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation,
/review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso,
/careful, /freeze, /guard, /unfreeze, /gstack-upgrade

If gstack skills aren't working, run: cd .claude/skills/gstack && ./setup
