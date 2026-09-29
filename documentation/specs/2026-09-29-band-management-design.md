# Band management — design

**Author:** Speira
**Date:** 2026-09-29
**Status:** Approved design, not implemented
**Answers:** [PRD](../PRD.md) open questions Q4 and Q5, and designs PRD §5.4 (FR-4.1 – FR-4.5)
**Affects:** `shared`, `context-user`, `context-band`, `context-chart`, `api-auth`, `api-chart`,
new `api-user` and `api-band`, `client-web`, `deployment`

---

## 1. Goal

A band leader keeps a band's line-up, repertoire and calendar in one place:

- **Members** — who plays in the band, what they play, how to reach them, when they are away.
- **Repertoire** — the charts the band plays, owned by the band.
- **Calendar** — performances and rehearsals, each with a precise location, a line-up chosen
  from the members, and a setlist chosen from the repertoire. This is the centre of the
  feature.

The app helps the leader contact people through the tools bands already use (a WhatsApp
group, SMS, email) but never sends a message itself.

### Non-goals (this version)

- Sending notifications (email, SMS, WhatsApp Business API, push).
- A searchable musician directory. The data is shaped for it (§4.1, §11) but nothing is
  indexed.
- Organisations (the 100-user tier), billing and tier entitlements.
- Recurring events, time-of-day unavailability, per-event chart overrides (key, arrangement).
- Real-time updates.

---

## 2. Decisions

| #   | Decision                                                                                                                                                                                          |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | A member is either a signed-up user or a **contact-only** record an admin keeps. A user can later **claim** a contact slot through an invitation.                                                 |
| D2  | **A band is a tenant** and owns its charts (answers Q4 and Q5). The personal tenant stays the Clerk user id. A personal chart can be copied into a band, which forks it.                          |
| D3  | Band permissions are **Owner / Admin / Member**, with exactly one owner.                                                                                                                          |
| D4  | Calendar events are typed (`PERFORMANCE`, `REHEARSAL`) and have **RSVP** per line-up musician. Booking an unavailable musician is a warning, not an error.                                        |
| D5  | Contact is by **deep links**: per musician (`wa.me/<phone>`, `sms:`, `mailto:`), an optional band WhatsApp group link, and an event announcement through `wa.me/?text=` / the share sheet / copy. |
| D6  | Persistence is **state-stored** (not event-sourced): one `bands` table and one `users` table with optimistic concurrency. Charts stay event-sourced.                                              |
| D7  | Unavailability belongs to the **person**, as whole-day ranges, scoped to **all bands** by default or to a chosen list of bands.                                                                   |
| D8  | Musician roles and styles are **controlled vocabularies** (stable slugs) shared by profiles, memberships and line-ups, so a future search works on canonical values.                              |
| D9  | Skill is a **per-role level of 1–5 stars**, optional and self-assessed. It replaces "years of practice".                                                                                          |
| D10 | The repertoire **is** the band tenant's active charts; there is no separate repertoire list.                                                                                                      |

**Why state-stored (D6).** Band data is relational and calendar-shaped: date ranges, "who is
free on the 14th", "which bands am I in". Those map directly onto DynamoDB keys. Event sourcing
pays off for charts, where history and versions are part of the product; for line-ups and
calendars only the current state matters, and a projection would double the code for
CRUD-shaped data. An append-only activity log can be added later next to each write, in the
same transaction, without changing this design.

---

## 3. Tenancy and access

### 3.1 Tenant ids

`TenantID` stays a string (1–255 chars). Its prefix tells the kind of tenant:

| Tenant   | Value                         | Example      |
| :------- | :---------------------------- | :----------- |
| Personal | the Clerk user id (unchanged) | `user_2abc…` |
| Band     | the band id, `band_<uuid>`    | `band_0f6c…` |

Existing charts stay where they are.

### 3.2 Resolving the tenant of a request

Chart operations take an optional `tenantId` argument.

- Absent → the caller's personal tenant, as today.
- `band_…` → the API handler calls `BandAccess.check(userId, bandId)`. It is a strongly
  consistent `GetItem` on `BAND#<bandId> / USER#<userId>` and returns the caller's permission,
  or fails with `Forbidden`.
- Any other value → `Forbidden`. A user never names another user's personal tenant.

The check runs on **every request**. The authorizer does not carry band memberships: its result
is cached for 300 s, so a removed member would keep access for up to five minutes, and the
context would grow with every band. One read per request is the price.

`BandAccess` is exported from `@chordcraft/context-band`. `api-chart` depends on that public
API, never on the band tables' layout.

### 3.3 Permission matrix

| Action                                                             | Owner |       Admin       | Member |
| :----------------------------------------------------------------- | :---: | :---------------: | :----: |
| Read the band, members, calendar, repertoire and band charts       |   ✓   |         ✓         |   ✓    |
| Create and edit band charts                                        |   ✓   |         ✓         |   ✓    |
| Archive band charts (removes them from the repertoire)             |   ✓   |         ✓         |   –    |
| Schedule, edit and cancel gigs; set line-ups and setlists          |   ✓   |         ✓         |   –    |
| Add, edit and remove members; invite                               |   ✓   | ✓ (not the owner) |   –    |
| Record an RSVP for a contact-only member                           |   ✓   |         ✓         |   –    |
| Promote and demote admins                                          |   ✓   |         –         |   –    |
| Delete the band, transfer ownership                                |   ✓   |         –         |   –    |
| RSVP to a gig; edit own profile and unavailability; leave the band | self  |       self        |  self  |

The owner cannot leave a band before transferring ownership.

### 3.4 Visibility of personal data

- A profile's contact fields (email, phone, channel) and region are visible to members of the
  bands the person belongs to, and to no one else.
- A contact-only member's data is visible to that band only.
- Unavailability is visible to a band only for entries in scope for that band (§4.1). The
  reason is shown only for entries scoped to that band explicitly; an `ALL` entry shows as
  "unavailable" without its reason.

---

## 4. Domain model

### 4.1 Shared vocabulary — `@chordcraft/shared`

Used by the client and by both contexts, so it lives next to the musical value objects.

**`MusicianRole`** — an `as const` catalogue of stable slugs, grouped by family. A slug never
changes once published; its label comes from `next-intl`, so stored data carries no language.

| Family             | Slugs                                                       |
| :----------------- | :---------------------------------------------------------- |
| `VOCALS`           | `lead-vocals`, `backing-vocals`                             |
| `STRINGS`          | `guitar`, `bass`, `double-bass`, `violin`, `viola`, `cello` |
| `KEYS`             | `piano`, `keyboards`, `organ`, `synth`                      |
| `DRUMS_PERCUSSION` | `drums`, `percussion`                                       |
| `BRASS_WINDS`      | `saxophone`, `trumpet`, `trombone`, `flute`, `clarinet`     |
| `TECH`             | `sound-engineer`, `dj`, `music-director`                    |
| `OTHER`            | `other` — requires a free-text `detail` (1–40 chars)        |

**`MusicStyle`** — the same mechanism: `jazz`, `funk`, `soul`, `rock`, `pop`, `blues`,
`gospel`, `latin`, `reggae`, `hip-hop`, `electronic`, `classical`, `folk`, `metal`, `world`,
`other` (+ `detail`).

**`SkillLevel`** — optional, per role, displayed as stars. Stored as the slug plus its `rank`,
so "rank ≥ 3" is a range condition. Absent means _not specified_; there is no zero.

| Rank | Slug           | Shown as                              |
| :--: | :------------- | :------------------------------------ |
|  1   | `BEGINNER`     | learning, plays simple parts          |
|  2   | `INTERMEDIATE` | holds a part in a rehearsal           |
|  3   | `ADVANCED`     | confident on stage, reads charts      |
|  4   | `PROFESSIONAL` | gigs regularly, paid work             |
|  5   | `MASTER`       | reference level, session and teaching |

**Other value objects:** `PhoneNumber` (E.164, validated with `libphonenumber-js`), `Email`
(normalised to lower case), `ContactChannel` (`WHATSAPP | SMS | EMAIL | PHONE_CALL`),
`LocalDate` (`YYYY-MM-DD`), `DateRange` (`from ≤ to`, span ≤ 366 days), `CountryCode`
(ISO 3166-1 alpha-2).

### 4.2 `context-user` — `MusicianProfile`

One per Clerk user.

| Field              | Type                                                                    | Rules                                                                      |
| :----------------- | :---------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| `userId`           | `UserID`                                                                | Clerk `sub`; immutable                                                     |
| `name`             | string                                                                  | 1–100 chars                                                                |
| `email`            | `Email`                                                                 | from Clerk's verified email; not editable here                             |
| `phone?`           | `PhoneNumber`                                                           | required when `preferredChannel` is not `EMAIL`                            |
| `preferredChannel` | `ContactChannel`                                                        |                                                                            |
| `region?`          | `{ country: CountryCode, area?: string (≤ 100) }`                       |                                                                            |
| `roles`            | `{ role: RoleSlug, detail?, isPrimary: boolean, level?: SkillLevel }[]` | 1–10 entries, no duplicate role, at most one primary; `detail` iff `other` |
| `styles`           | `{ style: StyleSlug, detail? }[]`                                       | ≤ 20, no duplicates; `detail` iff `other`                                  |
| `version`          | number                                                                  | optimistic concurrency                                                     |

**`Unavailability`** — stored as separate items, not inside the profile.

```
Unavailability {
  id
  userId
  range: DateRange                          // whole days, inclusive
  reason?: string                           // ≤ 100 chars
  scope: 'ALL' | { bandIds: NonEmptyArray<BandID> }   // default 'ALL'
}
```

`Unavailability.appliesTo(bandId, date)` is true when the range contains `date` and the scope
is `ALL` or lists `bandId`.

### 4.3 `context-band` — `Band` aggregate

| Field                | Rules                                        |
| :------------------- | :------------------------------------------- |
| `id: BandID`         | `band_<uuid>`; also the band's `TenantID`    |
| `name`               | 1–100 chars                                  |
| `whatsappGroupLink?` | must start with `https://chat.whatsapp.com/` |
| `members`            | `Membership[]`, 1–15                         |
| `version`            | optimistic concurrency                       |

**`Membership`**

| Field                | Rules                                                                                                    |
| :------------------- | :------------------------------------------------------------------------------------------------------- |
| `memberId`           | stable across a claim                                                                                    |
| `link`               | `{ kind: 'USER', userId }` or `{ kind: 'CONTACT', contact: { name, email?, phone?, preferredChannel } }` |
| `roles`              | `RoleSlug[]`, 1–5, from the shared catalogue                                                             |
| `permission`         | `OWNER                                                                                                   | ADMIN | MEMBER` |
| `joinedAt`           | used to pick a successor owner (§8.2)                                                                    |
| `bandUnavailability` | `DateRange[]`, **contact-only members only**, implicitly scoped to this band                             |

**Band invariants**

1. Exactly one `OWNER`.
2. At most 15 members.
3. A `userId` appears at most once.
4. Contact emails are unique among `CONTACT` links. Accepting an invitation fails with
   `DUPLICATE_MEMBER` when the user is already a member (invariant 3).
5. Only a `USER` membership can be `OWNER` or `ADMIN`.
6. A contact's `phone` is required when its channel is not `EMAIL`.

The repertoire is not part of the aggregate (D10).

**Claiming a contact slot.** An admin invites a contact-only member by email. The invitation
expires after 14 days. A user whose **verified** Clerk email equals the invitation's email may
accept it: the membership's link becomes `USER`, its `memberId`, roles and gig history stay,
and its `bandUnavailability` moves into the user's profile as `Unavailability` entries with
`scope = { bandIds: [band] }`. A matching email only produces an invitation; nobody joins a
band without accepting.

### 4.4 `context-band` — `Gig` aggregate

One per calendar event. Separate from `Band` so that members answering at the same time do
not contend on the band record.

| Field                | Rules                                                      |
| :------------------- | :--------------------------------------------------------- |
| `id: GigID`          |                                                            |
| `bandId`             |                                                            |
| `type`               | `PERFORMANCE                                               | REHEARSAL`  |
| `title`              | 1–100 chars                                                |
| `startsAt`, `endsAt` | local date-times, with `endsAt > startsAt`                 |
| `timeZone`           | IANA name, e.g. `Europe/Paris`                             |
| `location`           | `{ venue, address, city, country: CountryCode, mapsUrl? }` |
| `status`             | `PLANNED                                                   | CONFIRMED   | CANCELLED`      |
| `lineUp`             | `{ memberId, role: RoleSlug, rsvp: 'PENDING'               | 'CONFIRMED' | 'DECLINED' }[]` |
| `setlist`            | `{ chartId, note?: string (≤ 200) }[]`, ordered            |
| `notes?`             | ≤ 2000 chars                                               |
| `version`            | optimistic concurrency                                     |

**Gig rules**

1. A line-up entry's member belongs to the band, and its `role` is one of that member's roles.
   A member appears once.
2. A setlist chart is an active chart of the band tenant when it is added.
3. The gig's **local dates** are the dates of `startsAt` and `endsAt` in `timeZone`. A line-up
   member unavailable on any of them is accepted, and the command returns an
   `AvailabilityWarning { memberId, dates }` next to the gig.
4. A musician answers only for themselves. An admin records the answer of a contact-only
   member.
5. Changing the dates, times or location of a `CONFIRMED` gig resets every RSVP to `PENDING`.
6. A `CANCELLED` gig is read-only, except for going back to `PLANNED`.

**Effects on other aggregates**

- Removing a member removes them from the line-up of **future** gigs. Past gigs keep it.
- Archiving a chart does not touch stored setlists: `context-chart` never calls the band
  context. A setlist shows an archived chart as archived, and a future gig carrying one shows
  the admin a warning to replace it.

### 4.5 Ports between contexts

Dependencies go one way. Each is an Effect `Context.Tag` declared in the consuming domain and
implemented in its infrastructure by calling the other package's public API. Tests supply
in-memory layers.

```
api-chart     ──► context-band   BandAccess            (who may act in a band tenant)
context-band  ──► context-user   MusicianDirectory     (names, contacts, unavailability)
context-band  ──► context-chart  RepertoireReader      (is this chart active in the band tenant?)
context-user  ──► shared
context-chart ──► shared         (never imports band or user)
```

---

## 5. Data model

Both tables are on-demand, with point-in-time recovery and AWS-owned encryption at rest, like
the chart tables.

### 5.1 `{stack}-bands`

| Item           | PK              | SK                  | Attributes and indexes                                                                                 |
| :------------- | :-------------- | :------------------ | :----------------------------------------------------------------------------------------------------- |
| Band           | `BAND#<bandId>` | `META`              | name, whatsappGroupLink, memberCount, version, createdAt, updatedAt                                    |
| Membership     | `BAND#<bandId>` | `MEMBER#<memberId>` | link, roles, permission, joinedAt, bandUnavailability                                                  |
| Access pointer | `BAND#<bandId>` | `USER#<userId>`     | memberId, permission. **GSI1** `GSI1PK = USER#<userId>`, `GSI1SK = BAND#<bandId>`                      |
| Invitation     | `BAND#<bandId>` | `INVITE#<memberId>` | email, invitedBy, expiresAt, `ttl`. **GSI2** `GSI2PK = EMAIL#<email>`, `GSI2SK = BAND#<bandId>`        |
| Gig            | `BAND#<bandId>` | `GIG#<gigId>`       | the whole gig (line-up and setlist embedded), version. **LSI1** `LSI1SK = GIGAT#<startsAtUtc>#<gigId>` |

| Access pattern            | Operation                                                                              |
| :------------------------ | :------------------------------------------------------------------------------------- |
| Authorise a band tenant   | `GetItem BAND#b / USER#u`, strongly consistent                                         |
| Load the Band aggregate   | `Query BAND#b`, `SK = META` and `begins_with(SK, 'MEMBER#')`                           |
| My bands                  | `Query GSI1`, `GSI1PK = USER#u`                                                        |
| Calendar for a date range | `Query LSI1`, `PK = BAND#b`, `LSI1SK BETWEEN GIGAT#<from> AND GIGAT#<to>~`, consistent |
| One gig                   | `GetItem BAND#b / GIG#g`                                                               |
| My pending invitations    | `Query GSI2`, `GSI2PK = EMAIL#<verified email>`, dropping expired items                |

**Writes**

- The Band aggregate is saved in one `TransactWriteItems`: an `Update` of `META` with
  `ConditionExpression version = :expected` (and `version + 1`), plus `Put`/`Delete` of the
  changed membership and access-pointer items. At most 1 + 15 + 15 items, under DynamoDB's
  100-item limit. Invariants spanning members are therefore checked on one consistent snapshot.
- A band is created with `attribute_not_exists(PK)` on `META`.
- A gig is saved with a conditional `Put` on `version`. A conflict fails with
  `ConcurrentModification`. RSVP commands retry up to three times (reload, reapply, save);
  admin edits surface the conflict.
- Invitations use DynamoDB TTL on `ttl` (epoch seconds). TTL deletion is lazy, so reads also
  filter on `expiresAt`.

### 5.2 `{stack}-users`

| Item           | PK              | SK                    | Attributes                                                           |
| :------------- | :-------------- | :-------------------- | :------------------------------------------------------------------- |
| Profile        | `USER#<userId>` | `PROFILE`             | name, email, phone, preferredChannel, region, roles, styles, version |
| Unavailability | `USER#<userId>` | `UNAVAIL#<from>#<id>` | to, reason, scope (`ALL` or a `bandIds` string set)                  |

**"Is this user unavailable on date D for band B?"** An entry covering D starts no earlier than
`D − 366 days` (the span cap). So:
`Query PK = USER#u, SK BETWEEN UNAVAIL#<D−366> AND UNAVAIL#<D>~`, then keep entries with
`to ≥ D` and `appliesTo(B, D)`. For a date range `[F, T]`, the bounds become `F − 366` and `T`.
A line-up (≤ 15 users) costs ≤ 15 parallel queries.

---

## 6. API

### 6.1 Lambdas

| Package          | Serves                            | Table access                                               |
| :--------------- | :-------------------------------- | :--------------------------------------------------------- |
| `api-user` (new) | profile and unavailability        | `users` read/write                                         |
| `api-band` (new) | bands, members, invitations, gigs | `bands` read/write; `users` read; `charts_projection` read |
| `api-chart`      | charts, now with band tenants     | chart tables as today; `bands` read (for `BandAccess`)     |

Every handler takes the caller from the authorizer's `resolverContext` and ignores identity
arguments from the client, as `api-chart` does. Each context keeps its `schema.graphql` under
`interface/graphql/`; `mergeSchemas.ts` merges the new ones.

The authorizer adds `email` and `emailVerified` to the resolver context. They come from a
custom Clerk session-token claim, because Clerk's default session token does not carry the
email.

### 6.2 `context-user`

```graphql
type Query {
  myProfile: MusicianProfile
  myUnavailability(from: AWSDate!, to: AWSDate!): [Unavailability!]!
}

type Mutation {
  saveMyProfile(input: SaveProfileInput!): MusicianProfile! # create or update
  addUnavailability(input: UnavailabilityInput!): Unavailability!
  updateUnavailability(id: ID!, input: UnavailabilityInput!): Unavailability!
  removeUnavailability(id: ID!): Boolean!
}
```

### 6.3 `context-band`

```graphql
type Query {
  myBands: [BandSummary!]! # id, name, my permission, memberCount
  band(bandId: ID!): Band # members, with profile data for USER links
  gigs(bandId: ID!, from: AWSDate!, to: AWSDate!): [Gig!]!
  gig(bandId: ID!, gigId: ID!): Gig
  bandAvailability(bandId: ID!, from: AWSDate!, to: AWSDate!): [MemberAvailability!]!
  myInvitations: [Invitation!]!
  myGigs(from: AWSDate!, to: AWSDate!): [Gig!]! # across my bands
}

type Mutation {
  createBand(input: CreateBandInput!): Band! # the caller becomes OWNER
  updateBand(bandId: ID!, input: UpdateBandInput!): Band! # name, whatsappGroupLink
  deleteBand(bandId: ID!): Boolean!
  transferOwnership(bandId: ID!, memberId: ID!): Band!

  addContactMember(bandId: ID!, input: ContactMemberInput!): Band!
  updateMember(bandId: ID!, memberId: ID!, input: UpdateMemberInput!): Band!
  setMemberPermission(bandId: ID!, memberId: ID!, permission: Permission!): Band!
  removeMember(bandId: ID!, memberId: ID!): Band!
  leaveBand(bandId: ID!): Boolean!
  setContactUnavailability(bandId: ID!, memberId: ID!, ranges: [DateRangeInput!]!): Band!

  inviteMember(bandId: ID!, memberId: ID!, email: AWSEmail!): Invitation!
  acceptInvitation(bandId: ID!, memberId: ID!): Band!
  declineInvitation(bandId: ID!, memberId: ID!): Boolean!

  scheduleGig(bandId: ID!, input: GigInput!): GigResult!
  updateGig(bandId: ID!, gigId: ID!, input: GigInput!): GigResult!
  setGigStatus(bandId: ID!, gigId: ID!, status: GigStatus!): Gig!
  respondToGig(bandId: ID!, gigId: ID!, rsvp: Rsvp!): Gig!
  recordRsvp(bandId: ID!, gigId: ID!, memberId: ID!, rsvp: Rsvp!): Gig!
}

type GigResult {
  gig: Gig!
  warnings: [AvailabilityWarning!]!
}

type AvailabilityWarning {
  memberId: ID!
  dates: [AWSDate!]!
}
```

`myGigs` fans out over the caller's bands (GSI1), one LSI1 query each.

### 6.4 `context-chart` changes

- `getChart`, `listCharts` and `createChart` take an optional `tenantId`, resolved as in §3.2.
- **`archiveChart(chartId: ID!, tenantId: String): Chart!`** — completes FR-2.6. Admins only in
  a band tenant.
- **`copyChartToTenant(chartId: ID!, targetTenantId: String!): Chart!`** — forks a chart into
  another tenant as a new `ChartCreated`. The caller must be able to read the source and
  create in the target.

---

## 7. Client (`client-web`)

| Route                          | Content                                                                                                                        |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `/profile`                     | profile form; role and style pickers with star levels; unavailability list with a date-range picker and scope selector         |
| `/bands`                       | my bands, pending invitations, create a band                                                                                   |
| `/bands/[bandId]`              | overview: next gigs, members (roles, levels, contact buttons), "Open band group"                                               |
| `/bands/[bandId]/calendar`     | month and list views of gigs, with member unavailability overlaid                                                              |
| `/bands/[bandId]/gigs/[gigId]` | details, location and map link, line-up with RSVP and availability warnings, ordered setlist, **Announce** and contact buttons |
| `/bands/[bandId]/repertoire`   | the band's charts: the existing chart list with `tenantId = bandId`                                                            |

A **tenant switcher** (Personal, then each band) in the chart area selects the tenant for chart
operations.

**Contact and announcements** (D5) are pure functions, translated with `next-intl` and unit
tested:

- `buildGigAnnouncement(gig, band, locale)` — date, time, venue, address, map link, line-up,
  setlist.
- `buildContactLink(channel, phone | email, message)` — `https://wa.me/<digits>?text=…`,
  `sms:<phone>?body=…`, `mailto:<email>?subject=…&body=…`, `tel:<phone>`.
- **Announce to the band** — `navigator.share` where available; otherwise
  `https://wa.me/?text=…`, which opens WhatsApp's chat picker so the admin chooses the group;
  plus "Copy message". WhatsApp offers no link that posts into a given group, which is why
  the group link only opens the group.

---

## 8. Errors and privacy

### 8.1 Errors

Tagged errors in each context's `domain/errors/`, returned in the Effect error channel:

- **band:** `BandNotFound`, `GigNotFound`, `MemberNotFound`, `Forbidden { required }`,
  `BandRuleViolation { rule }` (`MAX_MEMBERS`, `SINGLE_OWNER`, `OWNER_MUST_TRANSFER`,
  `DUPLICATE_MEMBER`, `ROLE_NOT_HELD`, `CHART_NOT_IN_REPERTOIRE`, `GIG_CANCELLED`, …),
  `InvitationNotFound`, `InvitationExpired`, `EmailNotVerified`, `ConcurrentModification`,
  `BandReadError`, `BandWriteError`.
- **user:** `ProfileNotFound`, `ProfileRuleViolation { rule }`, `UnavailabilityNotFound`,
  `UserReadError`, `UserWriteError`.

`AvailabilityWarning` is data, not an error.

The interface layer maps them to a stable AppSync `errorType` with a safe message:

| errorType    | From                                                                    | Logged with     |
| :----------- | :---------------------------------------------------------------------- | :-------------- |
| `VALIDATION` | `ParseError`, `*RuleViolation`, `InvitationExpired`, `EmailNotVerified` | `console.warn`  |
| `FORBIDDEN`  | `Forbidden`                                                             | `console.warn`  |
| `NOT_FOUND`  | `*NotFound`                                                             | —               |
| `CONFLICT`   | `ConcurrentModification`                                                | —               |
| `INTERNAL`   | read/write errors, anything unexpected                                  | `console.error` |

### 8.2 Privacy (GDPR; NFR-5)

- **Minimum data.** Required: name, email, one role. Phone, region, styles and levels are
  optional.
- **Visibility** as in §3.4.
- **Account deletion.** A Clerk `user.deleted` webhook (Svix signature verified) reaches a
  Lambda that deletes the profile and unavailability and removes the user from every band. When
  the user owned a band, ownership passes to the longest-standing admin, otherwise to the
  longest-standing `USER` member; a band left with no `USER` member is deleted.
- **Contact-only data** is entered by an admin about a third party. It is deleted with the
  membership or the band, and the form states that it should be entered with the person's
  agreement.
- **Access.** `myProfile`, `myUnavailability` and `myBands` return everything held about the
  caller.
- **Directory (future).** A searchable directory requires an opt-in `isDiscoverable` flag. It
  is not added until search is built.

---

## 9. Testing

| Layer          | Covers                                                                                                                                   | Kind                          |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------- |
| shared         | catalogues, `SkillLevel` ordering, `PhoneNumber`, `Email`, `DateRange`                                                                   | unit                          |
| domain         | every invariant in §4; RSVP reset; claim moving unavailability; scope filtering; a 23:30 `Europe/Paris` gig falls on its local date      | unit, test-first              |
| application    | handlers on in-memory repositories and ports; the permission matrix per command; RSVP retry on conflict                                  | unit                          |
| infrastructure | conditional writes and conflicts; the Band transaction; LSI1 range; unavailability at the 366-day edge; GSI1 and GSI2; the TTL attribute | `integration`, local DynamoDB |
| api            | non-member denied; **a removed member is denied on the next request**; missing `tenantId` falls back to personal; error mapping          | unit                          |
| client         | `buildGigAnnouncement` and `buildContactLink` per channel and locale                                                                     | unit                          |

---

## 10. Delivery phases

Each phase ships working, tested software and gets its own implementation plan.

| Phase | Scope                                                                                                                                   |
| :---: | :-------------------------------------------------------------------------------------------------------------------------------------- |
|   0   | Shared vocabulary and value objects (§4.1). Clerk `email` / `email_verified` claim through the authorizer.                              |
|   1   | Profiles: `context-user`, `users` table, `api-user`, `/profile`.                                                                        |
|   2   | Bands and members: `Band` aggregate, `BandAccess`, `bands` table, `api-band` (band and member operations), `/bands`, `/bands/[bandId]`. |
|   3   | Band charts: tenant resolution in `api-chart`, `archiveChart`, `copyChartToTenant`, tenant switcher, `/repertoire`.                     |
|   4   | Gigs: `Gig` aggregate, calendar, availability, line-up, RSVP, setlist.                                                                  |
|   5   | Invitations and claiming contact slots.                                                                                                 |
|   6   | Contact links and announcements.                                                                                                        |
|   7   | Account-deletion webhook. Required before public launch.                                                                                |

---

## 11. Future work this design leaves room for

- **Musician search.** Canonical role, style and level values plus `region.country` allow a
  sparse index item per role (`ROLE#<slug>#<country>` → user, sort by level) written with the
  profile, or an OpenSearch feed from a stream. Needs `isDiscoverable`.
- **Activity feed.** An `ACTIVITY#<timestamp>` item written in the same transaction as each
  band or gig change.
- **Notifications.** Email through SES first; the announcement text builder is reusable.
- **Organisations.** A tenant kind `org_…` above bands, reusing `BandAccess`'s pattern.
