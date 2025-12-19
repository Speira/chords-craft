# High-Level Design (HLD): Musical Chord Chart Platform (MVP)

**Author:** Speira
**Version:** 1.1 (MVP)  
**Date:** December 2025  
**Region:** `eu-west-3`
**Status:** Approved for Implementation

---

## 1. Abstract

This document describes the high-level architecture for a scalable, cloud-native application designed for creating and sharing musical chord charts. The system leverages a **Serverless Modular Monolith** approach on AWS to minimize operational costs (TCO) while providing global scalability. It emphasizes a "Value-Based" monetization strategy, offering unlimited public charts for free users while gating privacy and real-time collaboration features for premium tiers.

---

## 2. Requirements

### 2.1 Functional Requirements

- **User Management:** Secure authentication and tiered role management (Free, Standard, Premium, Orga).
- **Chord Chart Editor:** Creation and modification of musical grids with metadata (tags, titles).
- **Access Control:** Ability to toggle charts between Public and Private (Private reserved for Premium).
- **Multi-Tenancy:** Support for Groups (max 15 users) and Organizations (max 100 users).
- **Search:** Filter charts by name, tags within user's own collection.

### 2.2 Non-Functional Requirements (NFR)

- **Performance:** Layout and critical assets must load in **< 2 seconds**.
- **Cost Efficiency:** Strict "Pay-per-use" model with $0 fixed infrastructure costs for the MVP.
- **Scalability:** Support 20,000+ charts initially; architecture must sustain 1M+ users within a year.
- **Availability:** 99.9% uptime using managed AWS services.
- **Data Residency:** Fully GDPR compliant; data hosted in the EU (`eu-west-3`).

---

## 3. High-Level System Architecture

The architecture utilizes **Event Sourcing** with **CQRS** (Command Query Responsibility Segregation), coordinated via a managed GraphQL gateway.

### 3.1 Component Stack

| Layer            | Technology             | Role                                                                                     |
| :--------------- | :--------------------- | :--------------------------------------------------------------------------------------- |
| **Presentation** | Next.js / React Native | Web & Mobile clients using **React Query** for local state and cache management.         |
| **Edge / API**   | **AWS AppSync**        | GraphQL Gateway managing subscriptions, Auth, and caching for public data.               |
| **Compute**      | **AWS Lambda**         | TypeScript/Effect-TS Modular Monolith executing business logic and data transformations. |
| **Event Store**  | **Amazon DynamoDB**    | Append-only event log storing all domain events (ChartCreated, ChartUpdated, etc.).      |
| **Read Model**   | **Amazon DynamoDB**    | Projection table optimized for queries, rebuilt from events.                             |
| **Identity**     | **AWS Cognito**        | Managed IDP providing JWTs with custom claims for RBAC/PBAC.                             |
| **Storage**      | **Amazon S3**          | User and chart assets storage.                                                           |

---

## 4. Data Modeling (Event Sourcing + CQRS)

The system uses two DynamoDB tables to separate write concerns (events) from read concerns (projections).

### 4.1 Event Store Table (`charts_events`)

Append-only log of all domain events. Used for audit, replay, and rebuilding projections.

| Attribute  | Value                | Purpose                         |
| :--------- | :------------------- | :------------------------------ |
| **PK**     | `CHART#<ChartID>`    | Aggregate identifier            |
| **SK**     | `VERSION#<Version>`  | Event ordering within aggregate |
| eventType  | `ChartCreated`, etc. | Event type discriminator        |
| data       | `{...}`              | Event payload                   |
| occurredAt | ISO timestamp        | When the event happened         |

**Stream:** DynamoDB Streams enabled (`NEW_AND_OLD_IMAGES`) for future projection updates and integrations.

### 4.2 Projection Table (`charts_projection`)

Denormalized read model optimized for queries. Rebuilt from events.

| Attribute | Value                             | Purpose                            |
| :-------- | :-------------------------------- | :--------------------------------- |
| **PK**    | `TENANT#<TenantID>`               | Tenant isolation                   |
| **SK**    | `CHART#<ChartID>`                 | Chart identifier                   |
| GSI1PK    | `TENANT#<TenantID>`               | Query by tenant                    |
| GSI1SK    | `ACTIVE#<true/false>#<UpdatedAt>` | Filter active charts, sort by date |

### 4.3 Global Secondary Index (GSI1)

- **Purpose:** List active/inactive charts per tenant, sorted by last update.
- **Access Pattern:** "Show me all active charts for tenant X, newest first."

---

## 5. Critical System Flows

### 5.1 Command Flow (Write Path)

1. Client sends GraphQL mutation (e.g., `createChart`)
2. AppSync invokes Lambda resolver
3. Lambda validates command, generates domain events via `ChartAggregate`
4. Events appended to `charts_events` table
5. Projection updated in `charts_projection` table
6. Response returned to client

### 5.2 Query Flow (Read Path)

1. Client sends GraphQL query (e.g., `listCharts`)
2. AppSync invokes Lambda resolver
3. Lambda queries `charts_projection` table directly
4. Response returned to client

### 5.3 Projection Rebuild (Manual)

If projections become inconsistent, a CLI command replays all events:

```bash
# Rebuild all projections for a tenant
pnpm run rebuild-projections --tenant=<tenantId>
```

---

## 6. Deployment

- **Infrastructure as Code:** AWS CDK (TypeScript)
- **Strategy:** Direct deployment via `cdk deploy`
- **Environments:** `dev` (default), `prod` (via `--context env=prod`)

---

## 7. Risks & Mitigations

| Risk                 | Impact                              | Mitigation                                                 |
| :------------------- | :---------------------------------- | :--------------------------------------------------------- |
| **System Abuse**     | Bot spamming unlimited charts.      | AppSync rate limiting + Cognito throttling.                |
| **Projection Drift** | Read model out of sync with events. | Manual rebuild CLI; automated stream processing in future. |
| **Cold Starts**      | Slow first request after idle.      | Lambda provisioned concurrency if needed (cost tradeoff).  |

---

## 8. Future Considerations (Post-MVP)

Features to implement when scale or business needs justify the complexity:

### 8.1 Advanced Search (OpenSearch Serverless)

- **Trigger:** When DynamoDB query patterns become insufficient (e.g., full-text search across all public charts, popularity ranking).
- **Implementation:** DynamoDB Streams → Lambda → OpenSearch indexing.
- **Cost consideration:** OpenSearch Serverless has minimum OCU charges; delay until search is a validated user need.

### 8.2 Data Archiving (S3 Cold Storage)

- **Trigger:** When DynamoDB storage costs become significant or regulatory requirements demand long-term retention.
- **Implementation:** EventBridge Scheduler triggers monthly Lambda job to migrate inactive data to S3 as JSON.
- **Access:** Read-only mode via specialized Lambda resolver.

### 8.3 Canary Deployments (CodeDeploy)

- **Trigger:** When user base is large enough that deployment failures have significant impact.
- **Implementation:** AWS CodeDeploy with Linear/Canary traffic shifting, automatic rollback on CloudWatch error metrics > 0.5%.

### 8.4 Real-time Collaboration

- **Trigger:** Premium tier feature request.
- **Implementation:** AppSync subscriptions for live chart editing, conflict resolution via operational transforms or CRDTs.

### 8.5 Admin Dashboard

- **Trigger:** When manual AWS Console access becomes insufficient for moderation/monitoring.
- **Implementation:** Separate Next.js admin app with elevated Cognito permissions.
