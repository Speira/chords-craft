# High-Level Design (HLD): Musical Chord Chart Platform (MVP)

**Author:** Speira
**Version:** 1.0 (MVP)  
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
- **Advanced Search:** Global search by chart name, tags, and popularity metrics.

### 2.2 Non-Functional Requirements (NFR)

- **Performance:** Layout and critical assets must load in **< 2 seconds**.
- **Cost Efficiency:** Strict "Pay-per-use" model with $0 fixed infrastructure costs for the MVP.
- **Scalability:** Support 20,000+ charts initially; architecture must sustain 1M+ users within a year.
- **Availability:** 99.9% uptime using managed AWS services.
- **Data Residency:** Fully GDPR compliant; data hosted in the EU (`eu-west-3`).

---

## 3. High-Level System Architecture

The architecture utilizes **Polyglot Persistence** and a **CQRS-lite** pattern, coordinated via a managed GraphQL gateway.

### 3.1 Component Stack

| Layer             | Technology                | Role                                                                                       |
| :---------------- | :------------------------ | :----------------------------------------------------------------------------------------- |
| **Presentation**  | Next.js / React Native    | Web & Mobile clients using **React Query** for local state and cache management.           |
| **Edge / API**    | **AWS AppSync**           | GraphQL Gateway managing subscriptions (V2), Auth, and **2h TTL Caching** for public data. |
| **Compute**       | **AWS Lambda**            | TypeScript/Effect-TS Modular Monolith executing business logic and data transformations.   |
| **Primary Store** | **Amazon DynamoDB**       | Single-table NoSQL store for transactional data (Users, Charts, Memberships).              |
| **Search Engine** | **OpenSearch Serverless** | Indexed search for tags and popularity; decoupled via DynamoDB Streams.                    |
| **Identity**      | **AWS Cognito**           | Managed IDP providing JWTs with custom claims for RBAC/PBAC.                               |
| **Archiving**     | **Amazon S3**             | Cost-effective "Cold Storage" for archived Organization data.                              |

---

## 4. Data Modeling (Single Table Design)

To achieve sub-100ms database performance, the following schema is implemented in `AppTable`:

| Entity         | PK (Partition Key) | SK (Sort Key)            | Access Pattern                           |
| :------------- | :----------------- | :----------------------- | :--------------------------------------- |
| **User**       | `USER#<UserID>`    | `USER#<UserID>`          | Direct user profile lookup.              |
| **Chart**      | `USER#<OwnerID>`   | `CHART#<ChartID>`        | "My Charts" view (Query on PK).          |
| **Membership** | `USER#<UserID>`    | `MEMBERSHIP#<Type>#<ID>` | Authorization check: Is user in Group X? |

### 4.1 Global Secondary Indexes (GSI)

- **GSI1 (Group Board):** PK: `GROUP#<GroupID>`, SK: `UpdatedAt`.
- **GSI2 (Org Board):** PK: `ORGA#<OrgID>`, SK: `UpdatedAt`.

---

## 5. Critical System Flows

### 5.1 Zero-Downtime Deployment

- **Deployment Tool:** AWS CDK (Infrastructure as Code).
- **Strategy:** **AWS CodeDeploy (Canary/Linear)**.
- **Logic:** Traffic shifts 10% to the new Lambda version. Automated rollback triggers if CloudWatch error metrics exceed 0.5% during the "Bake Period."

### 5.2 Data Lifecycle & Archiving

1. **Detection:** An **EventBridge Scheduler** triggers a monthly Lambda Cleanup job.
2. **Migration:** Inactive Organization data is moved from DynamoDB to **Amazon S3** as JSON files.
3. **Access:** Archived data is accessible in "Read-Only" mode via a specialized Lambda resolver reading from S3.

---

## 6. Risks & Mitigations

| Risk                 | Impact                         | Mitigation                                                                                    |
| :------------------- | :----------------------------- | :-------------------------------------------------------------------------------------------- |
| **System Abuse**     | Bot spamming unlimited charts. | Strict **AppSync Rate Limiting** (Requests/sec per User ID).                                  |
| **OpenSearch Costs** | High OCU consumption.          | Use **Serverless Tier** + **2h Cache TTL** on AppSync for popular chart queries.              |
| **Stale Data**       | 2h delay in search results.    | Acceptable for MVP; user's own charts are read directly from DynamoDB for strong consistency. |
