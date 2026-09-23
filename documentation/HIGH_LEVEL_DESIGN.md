# High-Level Design (HLD): Musical Chord Chart Platform (MVP)

**Author:** Speira
**Version:** 1.1
**Date:** September 2026 (v1.0: December 2025)
**Region:** `eu-west-3`
**Status:** Approved for Implementation

> **Revision 1.1** corrects the two places where v1.0 no longer described the system being
> built: the identity provider (§3.1, §5) and the data model (§4). Nothing else in the design
> changed. Components that are designed but not yet built are marked _Planned_; the
> [PRD](./PRD.md) is the authority on what is shipped.

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
- **Advanced Search:** Global search by chart name, tags, and popularity metrics.

### 2.2 Non-Functional Requirements (NFR)

- **Performance:** Layout and critical assets must load in **< 2 seconds**.
- **Cost Efficiency:** Strict "Pay-per-use" model with $0 fixed infrastructure costs for the MVP.
- **Scalability:** Support 20,000+ charts initially; architecture must sustain 1M+ users within a year.
- **Availability:** 99.9% uptime using managed AWS services.
- **Data Residency:** Fully GDPR compliant; data hosted in the EU (`eu-west-3`).

---

## 3. High-Level System Architecture

The architecture utilizes **Polyglot Persistence** and an **Event-Sourced CQRS** pattern,
coordinated via a managed GraphQL gateway.

### 3.1 Component Stack

| Layer             | Technology                | Role                                                                                                     | State     |
| :---------------- | :------------------------ | :------------------------------------------------------------------------------------------------------- | :-------- |
| **Presentation**  | Next.js                   | Web client (App Router, React 19), querying AppSync through `graphql-request`.                           | Built     |
| **Presentation**  | React Native              | Mobile client.                                                                                           | _Planned_ |
| **Edge / API**    | **AWS AppSync**           | GraphQL Gateway. Lambda authorization today; subscriptions and **2h TTL Caching** for public data in V2. | Built     |
| **Compute**       | **AWS Lambda**            | TypeScript/Effect-TS Modular Monolith executing business logic and data transformations.                 | Built     |
| **Primary Store** | **Amazon DynamoDB**       | Event store plus read projection (see §4).                                                               | Built     |
| **Identity**      | **Clerk**                 | Managed IDP. Its session JWT is verified by the `api-auth` Lambda authorizer, which derives the tenant.  | Built     |
| **Search Engine** | **OpenSearch Serverless** | Indexed search for tags and popularity; decoupled via DynamoDB Streams.                                  | _Planned_ |
| **Archiving**     | **Amazon S3**             | Cost-effective "Cold Storage" for archived Organization data. Buckets exist; no lifecycle job yet.       | _Partial_ |

**Identity note.** v1.0 of this document specified AWS Cognito. The implementation uses
**Clerk** (`packages/api-auth`, `@clerk/nextjs`): AppSync is configured with
`AuthorizationType.LAMBDA`, and the authorizer verifies the Clerk token with
`@clerk/backend`, returning `userId` and `tenantId` as the resolver context. Cognito is no
longer part of the design.

---

## 4. Data Modeling

The system is event-sourced: writes append to an immutable event log, and reads are served
from a denormalized projection. This replaces the single `AppTable` described in v1.0.

### 4.1 Event Store — `{stack}-charts_events`

Append-only history; a chart is rebuilt by folding its events.

| Entity          | PK (Partition Key) | SK (Sort Key)       | Access Pattern                   |
| :-------------- | :----------------- | :------------------ | :------------------------------- |
| **Chart event** | `CHART#<ChartID>`  | `VERSION#<Version>` | Replay one chart's full history. |

Pay-per-request, point-in-time recovery on, and a `NEW_AND_OLD_IMAGES` stream enabled for
the future search indexer (§3.1). Nothing consumes the stream yet.

### 4.2 Read Projection — `{stack}-charts_projection`

Current chart state, optimised for reads and partitioned by tenant, which is what makes
tenant isolation a property of the key rather than of a filter.

| Entity    | PK (Partition Key)  | SK (Sort Key)     | Access Pattern                      |
| :-------- | :------------------ | :---------------- | :---------------------------------- |
| **Chart** | `TENANT#<TenantID>` | `CHART#<ChartID>` | `getChart`, and `listCharts` by PK. |

**GSI1 (Active charts by tenant):** PK `TENANT#<TenantID>`, SK
`ACTIVE#<IsActive>#<UpdatedAt>`. `findByTenant` queries it with `begins_with(GSI1SK,
'ACTIVE#true#')` and `ScanIndexForward: false`, so `listCharts` returns a tenant's active
charts newest first. The index projects every attribute because a full `Chart` is rebuilt
from it. `findAllByTenant` reads the base table when archived charts must be included.

### 4.3 Users, memberships and boards — _Planned_

Users live in Clerk, so no `USER#` item exists in DynamoDB today. Memberships, group boards
and organisation boards (v1.0's GSI1/GSI2) are deferred with the band and organisation
features, and depend on the tenancy decision tracked as **Q5** in the [PRD](./PRD.md#10-open-questions):
today the authorizer sets `tenantId = userId`, which keeps the system single-tenant per user
and defers the choice rather than making it.

---

## 5. Critical System Flows

### 5.1 Zero-Downtime Deployment — _Planned_

- **Deployment Tool:** AWS CDK (Infrastructure as Code). _Built._
- **Strategy:** **AWS CodeDeploy (Canary/Linear)**.
- **Logic:** Traffic shifts 10% to the new Lambda version. Automated rollback triggers if CloudWatch error metrics exceed 0.5% during the "Bake Period."

The CDK stack ships `packages/api-*/build` as the Lambda code asset; the canary deployment
group is not configured yet.

### 5.2 Data Lifecycle & Archiving — _Planned_

1. **Detection:** An **EventBridge Scheduler** triggers a monthly Lambda Cleanup job.
2. **Migration:** Inactive Organization data is moved from DynamoDB to **Amazon S3** as JSON files.
3. **Access:** Archived data is accessible in "Read-Only" mode via a specialized Lambda resolver reading from S3.

The chart and user buckets are provisioned; the scheduler and the cleanup job are not.

---

## 6. Risks & Mitigations

| Risk                 | Impact                         | Mitigation                                                                                    |
| :------------------- | :----------------------------- | :-------------------------------------------------------------------------------------------- |
| **System Abuse**     | Bot spamming unlimited charts. | Strict **AppSync Rate Limiting** (Requests/sec per User ID).                                  |
| **OpenSearch Costs** | High OCU consumption.          | Use **Serverless Tier** + **2h Cache TTL** on AppSync for popular chart queries.              |
| **Stale Data**       | 2h delay in search results.    | Acceptable for MVP; user's own charts are read directly from DynamoDB for strong consistency. |
| **Projection drift** | Reads disagree with the log.   | `rebuildChartProjections` (`infrastructure/cli.ts`) refolds each chart from the event store.  |

On projection drift: the rebuild enumerates charts through the projection itself, so it
repairs a stale item but cannot recover one that is missing entirely. Enumerating from the
event store is the fix when that matters.
