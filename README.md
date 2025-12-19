# Chords Chart

SaaS platform for Musicians to help building their chords chart and share with others. Built with event sourcing, DDD, and serverless architecture
(find more details about the architecture design in the [High level design document](HIGH_LEVEL_DESIGN.md)).

## Overview

**Problem:** Musicians struggle to create and share their music chords chart in a standard way.

**Solution:** Intuitive App to create chords chart and share with groups/friends

**Target:** 500+ Musicians and groups in Europe.

## Stack

- **Runtime:** AWS Lambda (Node.js/TypeScript)
- **Framework:** Effect TS for functional error handling
- **Architecture:** Event Sourcing + CQRS + DDD
- **Database:** DynamoDB (event store + read projections)
- **API:** AppSync (GraphQL) + API Gateway (webhooks)
- **Auth:** Cognito (multi-tenant isolation via JWT)

## Structure

```
packages/
├── api/
│   ├── chart-api/            # A dedicated lambda api
├── apps/
│   ├── web/                  # browser apps
│   │   ├── admin/
│   │   └── users/
│   └── mobile/               # mobile apps
│   │   ├── android/
│   │   └── ios/
├── contexts/                 # Bounded contexts (contains domain, application, infrastructure and interface)
│   ├── chart/                # Chart management
│   │   ├── domain/           # Entities, aggregates, events (pure TS)
│   │   ├── application/      # Commands, queries, handlers (Effect programs)
│   │   ├── infrastructure/   # DynamoDB repos, projections, layers
│   │   └── interface/        # GraphQL/Lambda adapters
│   └── user/                 # User management (planned)
├── deployment/               # Deployment (Infra as Code) via AWS CDK with Appsync
└── shared/                   # Common types, value objects
```

## Key Patterns

**Domain Layer**:

- `Chart.ts` - Rich entity with business methods
- `ChartAggregate.ts` - Validates commands, emits events
- `ChartEvents.ts` - Immutable facts (ChartCreated, ChartUpdated, etc.)
- `ChartRepository.ts` - Interface for event store
- `ChartProjection.ts` - Interface for read model

**Application Layer** (Effect programs):

- `commands/CreateChart/` - Command + Handler
- `queries/GetChart/` - Query + Handler

**Infrastructure Layer** (AWS implementations):

- `dynamodb/DynamoDBChartRepository.ts` - Event store (writes)
- `dynamodb/DynamoDBChartProjection.ts` - Read model (queries)
- `dynamodb/DynamoDBChartService.ts` - Expose service from DynamoDB
- `cli.ts` - Run action with infrastructure implementations (ex: rerun DynamoDB projector events)

**Interface Layer** (system boundaries, executions):

- `graphql/resolvers/` - AppSync resolvers
- `graphql/schema.graphql` - GraphQL schema for this context
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

**Clean**

To clean all packages in the monorepo:

```sh
pnpm clean
```
