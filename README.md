# MyKPI - Multi-tenant KPI Dashboard

SaaS platform for SMEs to visualize and track their KPIs through automated workflows. Built with event sourcing, DDD, and serverless architecture.

## Overview

**Problem:** Small businesses struggle to centralize and visualize their key metrics from multiple sources (Stripe, Google Sheets, etc.)

**Solution:** Secure dashboard that ingests data via n8n webhooks and displays real-time KPIs with historical trends (7 days).

**Target:** 500+ SME subscriptions with strict multi-tenant data isolation.## Stack

- **Runtime:** AWS Lambda (Node.js/TypeScript)
- **Framework:** Effect TS for functional error handling
- **Architecture:** Event Sourcing + CQRS + DDD
- **Database:** DynamoDB (event store + read projections)
- **API:** AppSync (GraphQL) + API Gateway (webhooks)
- **Auth:** Cognito (multi-tenant isolation via JWT)

## Structure

```
packages/
├── charts/                   # Bounded context
│   ├── domain/               # Entities, aggregates, events (pure TS)
│   ├── application/          # Commands, queries, handlers (Effect programs)
│   ├── infrastructure/       # DynamoDB repos, projections, layers
│   └── interface/            # GraphQL/Lambda adapters
├── users/                    # User management (planned)
└── shared/                   # Common types, value objects
```

## Key Patterns

**Domain Layer** (no dependencies, pure TS):

- `Chart.ts` - Rich entity with business methods
- `ChartAggregate.ts` - Validates commands, emits events
- `ChartEvents.ts` - Immutable facts (ChartCreated, ChartUpdated, etc.)
- `ChartRepository.ts` - Interface for event store
- `ChartProjection.ts` - Interface for read model

**Application Layer** (Effect programs, no runPromise):

- `commands/CreateChart/` - Command + Handler
- `queries/GetChart/` - Query + Handler

**Infrastructure Layer** (AWS implementations):

- `dynamodb/DynamoDBChartRepository.ts` - Event store (writes)
- `dynamodb/DynamoDBChartProjection.ts` - Read model (queries)
- `projectors/ChartProjector.ts` - Sync events → projection
- `layers.ts` - Effect layers for DI

**Interface Layer** (system boundaries, Effect.runPromise here):

- `graphql/resolvers/` - AppSync resolvers
- `http/` - API Gateway handlers

## DynamoDB Tables

**Event Store** (`charts_events`):

- PK: `CHART#{chartId}`
- SK: `VERSION#{version}`
- Stores: All events for audit/replay

**Projection** (`charts_projection`):

- PK: `TENANT#{tenantId}`
- SK: `CHART#{chartId}`
- GSI: Active charts by tenant
- Stores: Current chart state (optimized for reads)

## Operations

**Building**

To build all packages in the monorepo:

```sh
pnpm build
```

**Testing**

To test all packages in the monorepo:

```sh
pnpm test
```
