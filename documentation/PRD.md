# Product Requirements Document (PRD): Chords Chart

**Author:** Speira
**Version:** 1.0
**Date:** September 2026
**Status:** Reconstructed from codebase and existing documentation
**Companion documents:** [High-Level Design](./HIGH_LEVEL_DESIGN.md), [README](../README.md)

---

## 1. Purpose of this document

This PRD was extracted retroactively from the implemented codebase and the approved
High-Level Design. It serves two audiences:

- **Product** — a single statement of what the platform is for, who it serves, and what
  it must do.
- **Engineering** — an honest map of what is built versus what is only specified, so the
  gap between the two is a backlog rather than a surprise.

Every requirement below carries a status tag. Requirements are written from the product
intent; the status reflects the state of `main` as of this document's date.

| Tag           | Meaning                                                                          |
| :------------ | :------------------------------------------------------------------------------- |
| **Shipped**   | Implemented end to end and reachable by a user.                                  |
| **Partial**   | Domain or infrastructure exists, but the capability is not reachable end to end. |
| **Specified** | Described in the HLD or agreed in product discussion; no implementation.         |
| **Planned**   | Agreed in scope, design not yet settled.                                         |

---

## 2. Product overview

**Problem.** Musicians struggle to create, organise and share chord charts. Existing
options are either plain text files with no musical structure, or heavyweight notation
software aimed at written scores rather than the working chart a band actually reads on
stage.

**Solution.** A web application that treats a chord chart as structured musical data —
chords, sections, and an arrangement plan — rather than formatted text. Charts are
shareable, organisable, and belong to bands as well as individuals.

**Target.** 500+ musicians and bands in Europe, initially French- and English-speaking.

**Positioning.** Free users get unlimited public charts. Paid tiers unlock privacy,
band collaboration, and organisation-scale management.

---

## 3. Personas

| Persona                | Need                                                                                | Primary surface                   |
| :--------------------- | :---------------------------------------------------------------------------------- | :-------------------------------- |
| **Solo musician**      | Write down a song's chords quickly and find it again later.                         | Chart editor, personal chart list |
| **Band member**        | Read the band's agreed version of a chart, with the arrangement the band plays.     | Band chart list, chart view       |
| **Band leader**        | Keep the band's repertoire, rehearsals and line-up organised in one place.          | Band management                   |
| **Organisation admin** | Manage many bands and members under one account (music school, collective, church). | Organisation administration       |

---

## 4. Domain model

The domain model is implemented in `packages/shared/src/valueObjects` and
`packages/context-chart/src/domain`. It is the most mature part of the product and the
part a PRD should not paraphrase loosely — the vocabulary below is the product vocabulary.

### 4.1 Musical primitives — _Shipped_

- **Note** — the twelve chromatic pitches, with flat/sharp normalisation.
- **Chord** — a root note plus optional tonic, quality, extension, modifiers and additions.
  Chords round-trip between structured form and shorthand: `Chord.parse("Cm7")` yields
  root `C`, quality `Minor`, extension `7`.
  - **Quality:** major, minor, diminished (`°`), augmented (`+`), `sus2`, `sus4`.
  - **Extension:** `6`, `7`, `9`, `11`, `13` and their major forms (`Δ7`, `Δ9`, `Δ11`, `Δ13`).
  - **Modifier:** `b5`/`#5`, `b9`/`#9`, `b11`/`#11`, `b13`/`#13`. _Parsing not yet wired into `Chord.parse`._
  - **Addition:** `add9`, `add11`, `add13`. _Parsing not yet wired into `Chord.parse`._
- **Scale** — a chromatic sequence rotated to a given root. This is the foundation for
  transposition, though transposition itself is not yet exposed as a feature.

### 4.2 Chart structure — _Shipped_

- **Section** — a named part of a song: `Intro`, `Verse`, `Chorus`, `Bridge`,
  `Transition`, `Interlude`, `Ending`.
- **Structure** — for each section, a map of _style variants_ to chord sequences. A single
  section can carry several interpretations:

  ```json
  {
    "Intro": {
      "default": ["Cm7", "Dm7"],
      "jazz": ["Cm7b5", "Dm13"]
    }
  }
  ```

  This is a genuine product differentiator: one chart holds multiple arrangements of the
  same song rather than forcing a copy per version.

- **Plan** — the ordered list of sections that defines how the song is actually played
  (for example `Intro, Verse, Chorus, Verse, Chorus, Ending`). Structure says what each
  section contains; plan says the order.

### 4.3 Chart entity — _Shipped_

| Field                     | Type      | Notes                                          |
| :------------------------ | :-------- | :--------------------------------------------- |
| `id`                      | ChartID   | Generated on creation                          |
| `tenantId`                | TenantID  | Non-blank, 1–255 chars; the isolation boundary |
| `title`                   | string    |                                                |
| `author`                  | string    | Song author; defaults to empty                 |
| `root`                    | Note      | The chart's key                                |
| `structure`               | Structure | Sections → style variants → chords             |
| `plan`                    | Section[] | Arrangement order                              |
| `links`                   | string[]  | Reference recordings, scores, video            |
| `tags`                    | string[]  | Free-form classification                       |
| `isActive`                | boolean   | `false` once archived                          |
| `createdAt` / `updatedAt` | timestamp |                                                |

Charts are event-sourced. `ChartCreated` and `ChartArchived` are the implemented events;
a chart is rebuilt by folding its event history.

---

## 5. Functional requirements

### 5.1 Identity and access

| ID     | Requirement                                                                              | Status        |
| :----- | :--------------------------------------------------------------------------------------- | :------------ |
| FR-1.1 | A user can sign up with email and verify their address.                                  | **Shipped**   |
| FR-1.2 | A user can log in and is returned to the app through an auth callback.                   | **Shipped**   |
| FR-1.3 | API requests are authorised by a Lambda authorizer validating the identity token.        | **Shipped**   |
| FR-1.4 | Every chart operation is scoped to a tenant; a user cannot read another tenant's charts. | **Shipped**   |
| FR-1.5 | Roles are tiered: Free, Standard, Premium, Orga.                                         | **Specified** |

Identity is provided by **Clerk**. The HLD specifies Cognito; the implementation moved to
Clerk in December 2025 and the HLD has not been updated. See §9.

### 5.2 Chart authoring

| ID     | Requirement                                                                                | Status                                                                                                        |
| :----- | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| FR-2.1 | A user can create a chart with a title, key, sections, chord content and arrangement plan. | **Shipped**                                                                                                   |
| FR-2.2 | A user can attach tags and reference links to a chart.                                     | **Shipped**                                                                                                   |
| FR-2.3 | A user can record several style variants of the same section within one chart.             | **Shipped**                                                                                                   |
| FR-2.4 | A user can enter chords in shorthand (`Cm7`, `GΔ9`) rather than field by field.            | **Shipped**                                                                                                   |
| FR-2.5 | A user can edit an existing chart.                                                         | **Partial** — `Chart.update` exists in the domain; no command, handler or mutation exposes it.                |
| FR-2.6 | A user can archive a chart they no longer need.                                            | **Partial** — `ChartAggregate.archive` and `ChartArchived` exist; no command, handler or mutation exposes it. |
| FR-2.7 | A user can transpose a chart to another key.                                               | **Specified** — `Scale` provides the primitive; no feature built on it.                                       |
| FR-2.8 | Chord shorthand supports modifiers and additions (`C7b9`, `Cadd9`).                        | **Partial** — the value objects exist; `Chord.parse` does not yet consume them.                               |

### 5.3 Chart access and sharing

| ID     | Requirement                                              | Status                                                                                           |
| :----- | :------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| FR-3.1 | A chart is public or private according to its setup.     | **Specified** — no visibility field exists on the chart; `isActive` is archival, not visibility. |
| FR-3.2 | Public charts are readable without authentication.       | **Specified**                                                                                    |
| FR-3.3 | Private charts are a paid-tier capability.               | **Specified**                                                                                    |
| FR-3.4 | A user can retrieve one chart by id within their tenant. | **Shipped**                                                                                      |
| FR-3.5 | A user can list the charts in their tenant.              | **Shipped**                                                                                      |

FR-3.1 is the largest single gap between the specified product and the built one: privacy
is the headline paid feature and the data model has no field for it.

### 5.4 Band management — _Planned_

Bands are in scope and not yet designed in detail. The agreed shape:

| ID     | Requirement                                                                | Status              |
| :----- | :------------------------------------------------------------------------- | :------------------ |
| FR-4.1 | A band has a set-up: members and the instrument or role each one holds.    | **Planned**         |
| FR-4.2 | A band has a repertoire — the list of charts the band plays.               | **Planned**         |
| FR-4.3 | A band can schedule dates: rehearsals, training sessions and performances. | **Planned**         |
| FR-4.4 | Band members see the band's charts in addition to their own.               | **Planned**         |
| FR-4.5 | A band holds at most 15 users; an organisation at most 100.                | **Specified** (HLD) |

`packages/context-band` currently contains a single value-object stub. The bounded
context is scaffolded, not started.

### 5.5 Discovery

| ID     | Requirement                               | Status        |
| :----- | :---------------------------------------- | :------------ |
| FR-5.1 | A user can search public charts by title. | **Specified** |
| FR-5.2 | A user can search by tag.                 | **Specified** |
| FR-5.3 | Results can be ranked by popularity.      | **Specified** |

The HLD specifies OpenSearch Serverless fed by DynamoDB Streams. Neither the index nor
the stream consumer exists.

### 5.6 Monetization

| ID     | Requirement                                                         | Status        |
| :----- | :------------------------------------------------------------------ | :------------ |
| FR-6.1 | Free users get unlimited public charts.                             | **Specified** |
| FR-6.2 | Paid tiers unlock further features; the exact split is not settled. | **Planned**   |
| FR-6.3 | Tier entitlements are enforced at the API boundary.                 | **Specified** |

Candidate paid features, drawn from the requirements above: private charts (FR-3.3), band
collaboration (§5.4), organisation-scale management, and archive access. **The tier
boundaries are an open product decision** — see §10.

### 5.7 Presentation

| ID     | Requirement                                                      | Status      |
| :----- | :--------------------------------------------------------------- | :---------- |
| FR-7.1 | The interface is available in English and French.                | **Shipped** |
| FR-7.2 | Locale is part of the URL, so a chart link carries its language. | **Shipped** |
| FR-7.3 | The interface supports light and dark theming.                   | **Shipped** |

---

## 6. Non-functional requirements

Carried forward from the HLD; none has an automated check in the repository today.

| ID    | Requirement                                                          | Target                                            |
| :---- | :------------------------------------------------------------------- | :------------------------------------------------ |
| NFR-1 | Layout and critical assets load quickly.                             | < 2 s                                             |
| NFR-2 | Infrastructure is pay-per-use with no fixed MVP cost.                | $0 idle                                           |
| NFR-3 | The system supports the initial catalogue and scales well beyond it. | 20 000+ charts at launch; 1M+ users within a year |
| NFR-4 | The service stays available.                                         | 99.9%                                             |
| NFR-5 | Data is hosted in the EU and the service is GDPR compliant.          | `eu-west-3`                                       |
| NFR-6 | Tenants are isolated from one another.                               | Enforced on every read and write                  |

---

## 7. Current API surface

AppSync GraphQL, one operation set, all tenant-scoped:

```graphql
type Query {
  getChart(chartId: ID!, tenantId: String!): Chart
  listCharts(tenantId: String!): [Chart!]!
}

type Mutation {
  createChart(input: CreateChartInput!): Chart!
}
```

No update, archive, delete, share or search operation is exposed.

---

## 8. Out of scope

Explicitly not part of the current product:

- Audio playback, recording, or playing along with a chart.
- Staff notation, tablature, or printed score engraving.
- Lyrics management.
- A native mobile application. The HLD names React Native as a future client; the web
  app is the only client today.
- Real-time collaborative editing. AppSync subscriptions are named as a V2 capability.

---

## 9. Known inconsistencies

These are documented rather than silently resolved; each needs a product or engineering
decision.

1. **Identity provider drift.** The HLD specifies AWS Cognito throughout §3.1 and §5.
   The implementation uses Clerk (`packages/api-auth`, `@clerk/nextjs`). The README's
   stack section also still says Cognito. The HLD and README should be corrected to match
   the code.
2. **Schema field drift.** `packages/context-chart/.../schema.graphql` defines the chart
   field as `structure`; the generated
   `packages/deployment/src/generated/schema.graphql` defines it as `sections`. The
   domain model uses `structure`. The generated artefact appears stale and should be
   regenerated.
3. **Data model divergence.** The HLD describes a single `AppTable` keyed
   `USER#<OwnerID>` / `CHART#<ChartID>` with GSIs for group and org boards. The
   implementation uses two tables — an event store keyed `CHART#{chartId}` /
   `VERSION#{version}` and a projection keyed `TENANT#{tenantId}` / `CHART#{chartId}`.
   The implemented design is the better one; the HLD should be updated to it.
4. **Undocumented contexts.** `context-band` and `context-user` exist as packages but are
   absent from `CLAUDE.md`'s package map.
5. **Naming defect.** `packages/context-band/src/domain/valueObjects/BamdMember.ts` is
   misspelled; it should be `BandMember.ts`.

---

## 10. Open questions

| #   | Question                                                                                                                  | Blocks                       |
| :-- | :------------------------------------------------------------------------------------------------------------------------ | :--------------------------- |
| Q1  | Where exactly do the Free / Standard / Premium / Orga boundaries fall, and at what price points?                          | FR-6.2, all entitlement work |
| Q2  | What does "public" mean operationally — listed and searchable, or merely reachable by link?                               | FR-3.1, FR-3.2, §5.5         |
| Q3  | Is a chart's visibility set per chart, or inherited from the band or organisation that owns it?                           | FR-3.1, §5.4                 |
| Q4  | Does a band own charts directly, or reference charts owned by members?                                                    | FR-4.2, FR-4.4               |
| Q5  | Is `tenantId` the user, the band, or the organisation? The code treats it as an opaque string, which defers the decision. | §5.4, FR-1.4                 |

Q5 is the one to settle first: band management cannot be designed until the tenancy
boundary is decided, and the answer shapes every access-control rule that follows.

---

## 11. Backlog implied by this document

Ordered by what unblocks the most downstream work.

1. **Settle tenancy (Q5).** Everything in band management and access control depends on it.
2. **Add chart visibility.** A `visibility` field, the events to change it, and enforcement
   on read (FR-3.1 – FR-3.3). This is the paid tier's anchor feature.
3. **Complete the chart lifecycle.** Expose update (FR-2.5) and archive (FR-2.6) — both
   already exist in the domain and need only an application command and a mutation.
4. **Regenerate the deployment schema** and fix the `structure` / `sections` drift (§9.2).
5. **Update the HLD and README** to Clerk and to the two-table design (§9.1, §9.3).
6. **Design the band context** (§5.4) once Q4 and Q5 are answered.
7. **Finish chord parsing** for modifiers and additions (FR-2.8).
8. **Build transposition** on top of `Scale` (FR-2.7).
9. **Define tier entitlements** (Q1) and enforce them at the API boundary (FR-6.3).
10. **Add search** (§5.5) — the largest infrastructure addition, and the one most safely
    deferred.
