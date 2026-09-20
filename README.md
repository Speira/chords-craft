# Chords Chart

SaaS platform for Musicians to:

- Help building & share their chords charts.
- Organize, sync their bands.

Built with event sourcing, DDD, and serverless architecture.

- [Product Requirements Document](documentation/PRD.md) — what the product does, and what is built versus specified.
- [High Level Design](documentation/HIGH_LEVEL_DESIGN.md) — architecture design details.

## Overview

**Problem:** Musicians struggle to create and share their music chords chart.

**Solution:** Intuitive App to create chords chart and share with groups/friends

**Target:** 500+ Musicians and groups in Europe.

## Stack

- **Runtime:** AWS Lambda (Node.js/TypeScript)
- **Framework:** Effect TS for functional error handling
- **Architecture:** Event Sourcing + CQRS + DDD
- **Database:** DynamoDB (event store + read projections)
- **API:** AppSync (GraphQL), authorized by a Lambda authorizer
- **Auth:** Clerk (multi-tenant isolation via JWT claims)

## Structure

```bash
./packages/
  ├── api-chart/            # A dedicated AWS lambda api
  ├── api-auth/             # AppSync Lambda authorizer, verifying Clerk tokens
  ├── client-web/           # browser app using Next.js
  ├── context-chart/        # Bounded contexts for Chart
  │   ├── domain/           # Entities, aggregates, events (pure TS)
  │   ├── application/      # Commands, queries, handlers (Effect programs)
  │   ├── infrastructure/   # DynamoDB repos, projections, layers
  │   └── interface/        # GraphQL/Lambda adapters
  ├── context-band/         # Bounded context for Band — scaffolded, not started
  ├── context-user/         # Bounded context for User — scaffolded, not started
  ├── deployment/           # Deployment via AWS CDK with Appsync
  └── shared/               # Common types, value objects
```

`context-band` and `context-user` hold only their build setup and a value-object stub; they
are parked in `knip.jsonc` until the contexts are designed (see the PRD backlog).

## Key Patterns

**Domain Layer**:

- `Chart.ts` - Rich entity with business methods
- `ChartAggregate.ts` - Validates commands, emits events
- `events/ChartEvent.ts` - Immutable facts (ChartCreated, ChartUpdated, ChartArchived)
- `ChartRepository.ts` - Interface for event store
- `ChartProjection.ts` - Interface for read model

**Application Layer** (Effect programs):

- `commands/CreateChart/` - Command + Handler
- `queries/GetChart/`, `queries/ListChart/` - Query + Handler

**Infrastructure Layer** (AWS implementations):

- `dynamodb/DynamoDBChartRepository.ts` - Event store (writes)
- `dynamodb/DynamoDBChartProjection.ts` - Read model (queries)
- `dynamodb/DynamoDBChartService.ts` - Expose service from DynamoDB
- `cli.ts` - Run action with infrastructure implementations (ex: rerun events)

**Interface Layer** (system boundaries, executions):

- `graphql/resolvers/` - AppSync resolvers
- `graphql/schema.graphql` - GraphQL schema for this context

## DynamoDB Tables

**Event Store** (`charts_events`):

- PK: `CHART#{chartId}`
- SK: `VERSION#{version}`
- Stores: All events for audit/replay
- A stream (`NEW_AND_OLD_IMAGES`) is enabled; nothing consumes it yet

**Projection** (`charts_projection`):

- PK: `TENANT#{tenantId}`
- SK: `CHART#{chartId}`
- GSI1: `TENANT#{tenantId}` / `ACTIVE#{isActive}#{updatedAt}` — `findByTenant` reads it for
  a tenant's active charts, most recently updated first. `findAllByTenant` reads the base
  table when archived charts are needed too (the projection rebuild)
- Stores: Current chart state (optimized for reads)

## Operations

**Quality gate**:

Format check, lint, typecheck, knip and the test suite:

```sh
pnpm check
```

**Building**:

To build all packages in the monorepo:

```sh
pnpm build
```

**Testing**:

To test all packages in the monorepo:

```sh
pnpm test
```

Integration tests need a local DynamoDB (`docker compose up`) and run separately:

```sh
pnpm test:integration
```

**Developing**:

To run the web client:

```sh
pnpm dev:web
```

**Clean**:

To clean all packages in the monorepo:

```sh
pnpm clean
```
