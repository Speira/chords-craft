# Band management, phases 0–1: shared vocabulary and musician profiles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared musician vocabulary (roles, styles, levels, contact and date value
objects), the Clerk email claim, and end-to-end musician profiles with unavailability:
`context-user`, the `users` table, the `api-user` Lambda, the AppSync wiring and `/profile`.

**Architecture:** `@chordcraft/shared` gains the value objects every later phase uses.
`context-user` is a state-stored bounded context (no event sourcing): a `MusicianProfile`
and `Unavailability` entities, one `UserRepository` port, a DynamoDB adapter with optimistic
concurrency, and GraphQL resolvers. `api-user` is a Lambda that injects the authenticated
caller and routes to those resolvers. The client adds a `/profile` page.

**Tech Stack:** TypeScript 6, Effect 3.19 (`Schema`, `Effect`, `Layer`), Vitest 5, DynamoDB
(`@aws-sdk/lib-dynamodb`), `libphonenumber-js`, AppSync (GraphQL), AWS CDK, Next.js 16 +
React 19, `react-hook-form`, `next-intl`, Clerk.

**Spec:** [`documentation/specs/2026-09-29-band-management-design.md`](../specs/2026-09-29-band-management-design.md)
— phases 0 and 1 of §10. Read §3.4, §4.1, §4.2, §5.2, §6.1, §6.2, §8 before starting.

## Global Constraints

- Node ≥ 24, pnpm ≥ 11.17 (root `devEngines`). Region `eu-west-3`.
- Conventions (CLAUDE.md): import order `effect`/`react` → external → `@chordcraft/*` →
  own `#<package>/*` alias → `./` siblings. **No `../` imports** in any `context-*`/`api-*`
  file, tests included (ESLint `no-restricted-imports`).
- A `context-*` package never imports another `context-*` or `api-*` package (ESLint
  boundary). Cross-context wiring happens in an `api-*` package.
- Exported functions are `function` declarations; arrow functions only for callbacks,
  one-line helpers and typed handlers. `interface` for object shapes, `type` for unions, no
  `enum` (use `as const`), no `any`.
- Boolean variables are prefixed `is/has/can/should/could/require`; boolean-returning
  functions are prefixed `check`.
- `tsconfig.base.json` has `exactOptionalPropertyTypes: true` and `erasableSyntaxOnly: true`
  (no constructor parameter properties, no enums).
- Role, style and level slugs are **stable forever** once published; labels live only in the
  client dictionaries (`en.json`, `fr.json`).
- Tables: on-demand billing, point-in-time recovery on, table name `${stackName}-users`.
- Unavailability: whole days, a range covers at most **366** days, scope `ALL` or a non-empty
  list of band ids. Phase 1 UI only creates `ALL` entries (bands do not exist yet).
- Errors reach AppSync as `GraphQLDomainError` whose `errorType` is one of `VALIDATION`,
  `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL`; infrastructure details never reach the
  client.
- Commits: Conventional Commits, ending with the line
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. The lefthook hooks format and
  lint staged files; do not bypass them.

## Review Focus

1. **Another user's unavailability id** — `updateUnavailability`/`removeUnavailability` with
   an id that belongs to someone else must answer `NOT_FOUND`, never touch the entry. Pinned
   in Task 10.
2. **GraphQL `null` for omitted optional fields** (`phone: null`, `region: null`,
   `level: null`) must behave exactly like absence, not fail validation. Pinned in Task 12.
3. **Missing or unverified email claim** (Clerk template not configured yet) — the authorizer
   passes `email: ''`; `saveMyProfile` must answer `VALIDATION` naming `email`, not crash or
   store an empty email. Pinned in Tasks 6 and 12.
4. **A long absence that started almost a year before the queried window** (366-day range)
   must still be listed. Pinned in Task 11.
5. **Moving an unavailability to other dates** must remove it from its old dates' listing.
   Pinned in Task 11.

---

## File map

| Package        | Files                                                                                                                                                                                                                                                    |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared`       | `src/valueObjects/{MusicianRole,MusicStyle,SkillLevel,UserID,BandID,Email,PhoneNumber,ContactChannel,CountryCode,LocalDate,DateRange}.ts`, `src/valueObjects/index.ts`, tests beside the existing ones in `test/valueObjects/`                           |
| `api-auth`     | `src/claims.ts` (new), `src/utils.ts`, `src/index.ts`, `test/claims.test.ts` (new), `test/index.test.ts`                                                                                                                                                 |
| `context-user` | package config; `src/domain/**` (profile, unavailability, errors, port), `src/application/**` (6 commands/queries), `src/infrastructure/{dynamodb,memory}/**`, `src/interface/graphql/**` (schema, resolvers, error mapping), `test/**` mirroring `src/` |
| `api-user`     | new package: `src/index.ts`, `test/index.test.ts`, config                                                                                                                                                                                                |
| `deployment`   | `bin/mergeSchemas.ts`, `test/bin/mergeSchema.unit.test.ts`, `src/constants.ts`, `src/ChordsChartStack.ts`, `src/constructParts/{Database,Lambdas,AppSync,Monitoring}.construct.ts`, `README.md`                                                          |
| `client-web`   | `src/lib/graphql/{errors.ts,queries/profileQueries.ts,queries/index.ts}`, `src/features/profile/**`, `src/app/[locale]/profile/page.tsx`, `src/components/layout/HeaderNavigation.tsx`, `src/lib/nextIntl/dictionaries/{en,fr}.json`                     |
| root           | `tsconfig.base.json`, `tsconfig.build.json`, `vitest.config.ts`, `vitest.shared.ts`, `package.json`, `knip.jsonc`, `CLAUDE.md`, `README.md`, `documentation/{PRD,HIGH_LEVEL_DESIGN}.md`                                                                  |

---

# Phase 0 — shared vocabulary and the email claim

### Task 1: Role and style catalogues

**Files:**

- Create: `packages/shared/src/valueObjects/MusicianRole.ts`
- Create: `packages/shared/src/valueObjects/MusicStyle.ts`
- Modify: `packages/shared/src/valueObjects/index.ts`
- Test: `packages/shared/test/valueObjects/MusicianRole.test.ts`,
  `packages/shared/test/valueObjects/MusicStyle.test.ts`

**Interfaces:**

- Produces: `MusicianRole.{FAMILIES, ALL, OTHER, schema}`, types `MusicianRole.Slug`,
  `MusicianRole.Family`; `MusicStyle.{ALL, OTHER, schema}`, type `MusicStyle.Slug`. Imported
  as `import { MusicianRole, MusicStyle } from '@chordcraft/shared/valueObjects'`.

- [ ] **Step 1: Write the failing tests**

`packages/shared/test/valueObjects/MusicianRole.test.ts`:

```ts
import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { MusicianRole } from '#shared/valueObjects';

const decode = Schema.decodeUnknownEither(MusicianRole.schema);

describe('MusicianRole', () => {
  it('publishes exactly these slugs — renaming or removing one breaks stored profiles', () => {
    expect(MusicianRole.ALL).toEqual([
      'lead-vocals',
      'backing-vocals',
      'guitar',
      'bass',
      'double-bass',
      'violin',
      'viola',
      'cello',
      'piano',
      'keyboards',
      'organ',
      'synth',
      'drums',
      'percussion',
      'saxophone',
      'trumpet',
      'trombone',
      'flute',
      'clarinet',
      'sound-engineer',
      'dj',
      'music-director',
      'other',
    ]);
  });

  it('has no duplicate slug and every slug is kebab-case', () => {
    expect(new Set(MusicianRole.ALL).size).toBe(MusicianRole.ALL.length);
    for (const slug of MusicianRole.ALL) expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it('accepts a catalogue slug and rejects anything else', () => {
    expect(decode('guitar')._tag).toBe('Right');
    expect(decode('Guitar')._tag).toBe('Left');
    expect(decode('gtr')._tag).toBe('Left');
  });

  it('groups every slug under exactly one family', () => {
    const grouped = Object.values(MusicianRole.FAMILIES).flat();
    expect(grouped.toSorted()).toEqual([...MusicianRole.ALL].toSorted());
    expect(MusicianRole.FAMILIES.OTHER).toEqual([MusicianRole.OTHER]);
  });
});
```

`packages/shared/test/valueObjects/MusicStyle.test.ts`:

```ts
import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { MusicStyle } from '#shared/valueObjects';

describe('MusicStyle', () => {
  it('publishes exactly these slugs — renaming or removing one breaks stored profiles', () => {
    expect(MusicStyle.ALL).toEqual([
      'jazz',
      'funk',
      'soul',
      'rock',
      'pop',
      'blues',
      'gospel',
      'latin',
      'reggae',
      'hip-hop',
      'electronic',
      'classical',
      'folk',
      'metal',
      'world',
      'other',
    ]);
  });

  it('accepts a catalogue slug and rejects anything else', () => {
    expect(Schema.decodeUnknownEither(MusicStyle.schema)('funk')._tag).toBe('Right');
    expect(Schema.decodeUnknownEither(MusicStyle.schema)('Funk')._tag).toBe('Left');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run --project shared test/valueObjects/MusicianRole.test.ts test/valueObjects/MusicStyle.test.ts`
Expected: FAIL — `MusicianRole` / `MusicStyle` is not exported from `#shared/valueObjects`.

- [ ] **Step 3: Implement**

`packages/shared/src/valueObjects/MusicianRole.ts`:

```ts
// The role catalogue: what a musician plays or does in a band.
// A slug is stored in profiles and memberships, so it is never renamed or removed once
// published. Labels live in the client dictionaries (`musicianRole.<slug>`).

import { Schema } from 'effect';

export const FAMILIES = {
  VOCALS: ['lead-vocals', 'backing-vocals'],
  STRINGS: ['guitar', 'bass', 'double-bass', 'violin', 'viola', 'cello'],
  KEYS: ['piano', 'keyboards', 'organ', 'synth'],
  DRUMS_PERCUSSION: ['drums', 'percussion'],
  BRASS_WINDS: ['saxophone', 'trumpet', 'trombone', 'flute', 'clarinet'],
  TECH: ['sound-engineer', 'dj', 'music-director'],
  OTHER: ['other'],
} as const;

export type Family = keyof typeof FAMILIES;
export type Slug = (typeof FAMILIES)[Family][number];

export const ALL: ReadonlyArray<Slug> = Object.values(FAMILIES).flat();

/** The one slug that requires a free-text `detail`. */
export const OTHER = 'other' satisfies Slug;

export const schema = Schema.Literal(...ALL);
```

`packages/shared/src/valueObjects/MusicStyle.ts`:

```ts
// The style catalogue. Same stability rule as MusicianRole: slugs are stored, labels are not.

import { Schema } from 'effect';

export const ALL = [
  'jazz',
  'funk',
  'soul',
  'rock',
  'pop',
  'blues',
  'gospel',
  'latin',
  'reggae',
  'hip-hop',
  'electronic',
  'classical',
  'folk',
  'metal',
  'world',
  'other',
] as const;

export type Slug = (typeof ALL)[number];

/** The one slug that requires a free-text `detail`. */
export const OTHER = 'other' satisfies Slug;

export const schema = Schema.Literal(...ALL);
```

In `packages/shared/src/valueObjects/index.ts`, add (keeping the list alphabetical):

```ts
export * as MusicianRole from './MusicianRole';
export * as MusicStyle from './MusicStyle';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run --project shared`
Expected: PASS, all shared tests.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/valueObjects packages/shared/test/valueObjects
git commit -m "feat(shared): add the musician role and style catalogues"
```

---

### Task 2: Skill level

**Files:**

- Create: `packages/shared/src/valueObjects/SkillLevel.ts`
- Modify: `packages/shared/src/valueObjects/index.ts`
- Test: `packages/shared/test/valueObjects/SkillLevel.test.ts`

**Interfaces:**

- Produces: `SkillLevel.{LEVELS, schema, rankOf}`, type `SkillLevel.SkillLevel`
  (`'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL' | 'MASTER'`),
  `rankOf(level): number` (1–5).

- [ ] **Step 1: Write the failing test**

`packages/shared/test/valueObjects/SkillLevel.test.ts`:

```ts
import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { SkillLevel } from '#shared/valueObjects';

describe('SkillLevel', () => {
  it('ranks the levels from 1 (beginner) to 5 (master)', () => {
    expect(SkillLevel.LEVELS.map((level) => SkillLevel.rankOf(level))).toEqual([1, 2, 3, 4, 5]);
    expect(SkillLevel.rankOf('PROFESSIONAL')).toBe(4);
  });

  it('has no zero level: absence means "not specified"', () => {
    expect(Schema.decodeUnknownEither(SkillLevel.schema)('NONE')._tag).toBe('Left');
    expect(Schema.decodeUnknownEither(SkillLevel.schema)(0)._tag).toBe('Left');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run --project shared test/valueObjects/SkillLevel.test.ts`
Expected: FAIL — `SkillLevel` is not exported.

- [ ] **Step 3: Implement**

`packages/shared/src/valueObjects/SkillLevel.ts`:

```ts
// A self-assessed level per role, shown as 1 to 5 stars. There is no zero: an absent level
// means "not specified". The order of LEVELS is the ranking, so it never changes.

import { Schema } from 'effect';

export const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL', 'MASTER'] as const;

export type SkillLevel = (typeof LEVELS)[number];

export const schema = Schema.Literal(...LEVELS);

/** The star count, 1 to 5; what a future musician search compares. */
export const rankOf = (level: SkillLevel) => LEVELS.indexOf(level) + 1;
```

Add to `index.ts`: `export * as SkillLevel from './SkillLevel';`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run --project shared`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/valueObjects packages/shared/test/valueObjects
git commit -m "feat(shared): add the per-role skill level"
```

---

### Task 3: User and band identifiers

**Files:**

- Create: `packages/shared/src/valueObjects/UserID.ts`, `packages/shared/src/valueObjects/BandID.ts`
- Modify: `packages/shared/src/valueObjects/index.ts`
- Test: `packages/shared/test/valueObjects/Identifiers.test.ts`

**Interfaces:**

- Produces: `UserID.schema` (branded `UserID`, the Clerk `sub`, `user_<alnum>`),
  `BandID.schema` (branded `BandID`, `band_<uuid v4 lowercase>`). `BandID.generate` is **not**
  added here; phase 2 adds it with band creation.

- [ ] **Step 1: Write the failing test**

`packages/shared/test/valueObjects/Identifiers.test.ts`:

```ts
import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { BandID, UserID } from '#shared/valueObjects';

describe('UserID', () => {
  const decode = Schema.decodeUnknownEither(UserID.schema);

  it('accepts a Clerk user id', () => {
    expect(decode('user_2abcDEF123')._tag).toBe('Right');
  });

  it('rejects anything that is not a Clerk user id', () => {
    expect(decode('band_0f6c2c3e-1d4b-4c9a-9a0e-2b7c1d9e8f00')._tag).toBe('Left');
    expect(decode('user_')._tag).toBe('Left');
    expect(decode('user_abc def')._tag).toBe('Left');
    expect(decode(`user_${'a'.repeat(80)}`)._tag).toBe('Left');
  });
});

describe('BandID', () => {
  const decode = Schema.decodeUnknownEither(BandID.schema);

  it('accepts band_<uuid>', () => {
    expect(decode('band_0f6c2c3e-1d4b-4c9a-9a0e-2b7c1d9e8f00')._tag).toBe('Right');
  });

  it('rejects a user id, an uppercase uuid or a bare uuid', () => {
    expect(decode('user_123')._tag).toBe('Left');
    expect(decode('band_0F6C2C3E-1D4B-4C9A-9A0E-2B7C1D9E8F00')._tag).toBe('Left');
    expect(decode('0f6c2c3e-1d4b-4c9a-9a0e-2b7c1d9e8f00')._tag).toBe('Left');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run --project shared test/valueObjects/Identifiers.test.ts`
Expected: FAIL — `BandID` / `UserID` not exported.

- [ ] **Step 3: Implement**

`packages/shared/src/valueObjects/UserID.ts`:

```ts
// The Clerk user id (`sub` claim). It is also the user's personal TenantID.

import { Schema } from 'effect';

export const schema = Schema.String.pipe(
  Schema.pattern(/^user_[A-Za-z0-9]+$/, { message: () => 'Expected a Clerk user id (user_…)' }),
  Schema.maxLength(64),
  Schema.brand('UserID'),
);
export type UserID = typeof schema.Type;
```

`packages/shared/src/valueObjects/BandID.ts`:

```ts
// A band id is also the band's TenantID, so its prefix tells a band tenant from a personal one.

import { Schema } from 'effect';

const PATTERN = /^band_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const schema = Schema.String.pipe(
  Schema.pattern(PATTERN, { message: () => 'Expected a band id (band_<uuid>)' }),
  Schema.brand('BandID'),
);
export type BandID = typeof schema.Type;
```

Add to `index.ts`: `export * as BandID from './BandID';` and `export * as UserID from './UserID';`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run --project shared`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/valueObjects packages/shared/test/valueObjects
git commit -m "feat(shared): add the user and band identifiers"
```

---

### Task 4: Contact value objects

**Files:**

- Modify: `packages/shared/package.json` (add `libphonenumber-js`)
- Create: `packages/shared/src/valueObjects/{Email,PhoneNumber,ContactChannel,CountryCode}.ts`
- Modify: `packages/shared/src/valueObjects/index.ts`
- Test: `packages/shared/test/valueObjects/Contact.test.ts`

**Interfaces:**

- Produces:
  - `Email.schema` — decodes any string, trims and lowercases it, then checks the shape;
    type `Email.Email` (branded).
  - `PhoneNumber.schema` — decodes an international number (`+33 6 12 34 56 78`) to E.164
    (`+33612345678`); type `PhoneNumber.PhoneNumber` (branded).
  - `ContactChannel.{CHANNELS, schema, checkRequiresPhone}`, type
    `ContactChannel.ContactChannel` = `'WHATSAPP' | 'SMS' | 'EMAIL' | 'PHONE_CALL'`.
  - `CountryCode.{ALL, schema}`, type `CountryCode.CountryCode` (branded, uppercase ISO 3166-1
    alpha-2). `ALL` is the list the client offers.

- [ ] **Step 1: Add the dependency**

Run: `pnpm --filter @chordcraft/shared add libphonenumber-js@^1.12.0`
Expected: `packages/shared/package.json` lists `"libphonenumber-js"` under `dependencies`.

- [ ] **Step 2: Write the failing test**

`packages/shared/test/valueObjects/Contact.test.ts`:

```ts
import { Either, Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { ContactChannel, CountryCode, Email, PhoneNumber } from '#shared/valueObjects';

describe('Email', () => {
  const decode = Schema.decodeUnknownEither(Email.schema);

  it('normalises case and surrounding spaces', () => {
    expect(decode('  Ana.Lopez@Example.COM ')).toEqual(Either.right('ana.lopez@example.com'));
  });

  it('rejects what is not an email address', () => {
    expect(decode('')._tag).toBe('Left');
    expect(decode('ana@')._tag).toBe('Left');
    expect(decode('ana example.com')._tag).toBe('Left');
    expect(decode(`${'a'.repeat(250)}@example.com`)._tag).toBe('Left');
  });
});

describe('PhoneNumber', () => {
  const decode = Schema.decodeUnknownEither(PhoneNumber.schema);

  it('normalises an international number to E.164', () => {
    expect(decode('+33 6 12 34 56 78')).toEqual(Either.right('+33612345678'));
    expect(decode('+447911123456')).toEqual(Either.right('+447911123456'));
  });

  it('rejects a national number without its country code', () => {
    expect(decode('0612345678')._tag).toBe('Left');
  });

  it('rejects a number of impossible length', () => {
    expect(decode('+331')._tag).toBe('Left');
  });

  it('re-decodes its own output, so stored numbers load back', () => {
    const stored = Schema.decodeUnknownSync(PhoneNumber.schema)('+33 6 12 34 56 78');
    expect(decode(stored)).toEqual(Either.right('+33612345678'));
  });
});

describe('ContactChannel', () => {
  it('requires a phone for every channel but email', () => {
    expect(ContactChannel.CHANNELS.filter((c) => ContactChannel.checkRequiresPhone(c))).toEqual([
      'WHATSAPP',
      'SMS',
      'PHONE_CALL',
    ]);
  });
});

describe('CountryCode', () => {
  const decode = Schema.decodeUnknownEither(CountryCode.schema);

  it('accepts an uppercase ISO 3166-1 alpha-2 code', () => {
    expect(decode('FR')._tag).toBe('Right');
    expect(CountryCode.ALL).toContain('FR');
  });

  it('rejects lowercase, unknown and three-letter codes', () => {
    expect(decode('fr')._tag).toBe('Left');
    expect(decode('XX')._tag).toBe('Left');
    expect(decode('FRA')._tag).toBe('Left');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run --project shared test/valueObjects/Contact.test.ts`
Expected: FAIL — the four modules are not exported.

- [ ] **Step 4: Implement**

`packages/shared/src/valueObjects/Email.ts`:

```ts
import { Schema } from 'effect';

const PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Normalized = Schema.transform(Schema.String, Schema.String, {
  strict: true,
  decode: (value) => value.trim().toLowerCase(),
  encode: (value) => value,
});

const Checked = Schema.String.pipe(
  Schema.maxLength(254),
  Schema.pattern(PATTERN, { message: () => 'Expected an email address' }),
  Schema.brand('Email'),
);

/** Trimmed and lowercased before it is checked, so one address has one spelling. */
export const schema = Schema.compose(Normalized, Checked);
export type Email = typeof schema.Type;
```

`packages/shared/src/valueObjects/PhoneNumber.ts`:

```ts
import { ParseResult, Schema } from 'effect';

import { parsePhoneNumberFromString } from 'libphonenumber-js';

const E164 = Schema.String.pipe(Schema.pattern(/^\+[1-9]\d{6,14}$/), Schema.brand('PhoneNumber'));

/**
 * An international number, stored in E.164 (`+33612345678`). A national number (`06…`) is rejected:
 * without its country code it cannot be dialled from a deep link.
 */
export const schema = Schema.transformOrFail(Schema.String, E164, {
  strict: true,
  decode: (input, _, ast) => {
    const phone = parsePhoneNumberFromString(input);
    return phone?.isValid()
      ? ParseResult.succeed(phone.number)
      : ParseResult.fail(
          new ParseResult.Type(
            ast,
            input,
            `"${input}" is not an international phone number (e.g. +33612345678)`,
          ),
        );
  },
  encode: ParseResult.succeed,
});
export type PhoneNumber = typeof schema.Type;
```

`packages/shared/src/valueObjects/ContactChannel.ts`:

```ts
import { Schema } from 'effect';

export const CHANNELS = ['WHATSAPP', 'SMS', 'EMAIL', 'PHONE_CALL'] as const;

export type ContactChannel = (typeof CHANNELS)[number];

export const schema = Schema.Literal(...CHANNELS);

/** Every channel but email reaches the person through their phone number. */
export const checkRequiresPhone = (channel: ContactChannel) => channel !== 'EMAIL';
```

`packages/shared/src/valueObjects/CountryCode.ts`:

```ts
import { Schema } from 'effect';

import { getCountries } from 'libphonenumber-js';

/**
 * ISO 3166-1 alpha-2 codes, taken from libphonenumber's metadata so the list stays maintained
 * without a second dependency. It also carries a few territories with their own dialling code (e.g.
 * `AC`), which is harmless for a region field.
 */
export const ALL: ReadonlyArray<string> = getCountries();

const KNOWN = new Set(ALL);

export const schema = Schema.String.pipe(
  Schema.filter((code) => KNOWN.has(code), {
    message: () => 'Expected an ISO 3166-1 alpha-2 country code, e.g. FR',
  }),
  Schema.brand('CountryCode'),
);
export type CountryCode = typeof schema.Type;
```

Add to `index.ts`: `ContactChannel`, `CountryCode`, `Email`, `PhoneNumber` (`export * as X from './X';`).

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run --project shared`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/shared pnpm-lock.yaml
git commit -m "feat(shared): add email, phone number, contact channel and country code"
```

---

### Task 5: Local dates and date ranges

**Files:**

- Create: `packages/shared/src/valueObjects/LocalDate.ts`, `packages/shared/src/valueObjects/DateRange.ts`
- Modify: `packages/shared/src/valueObjects/index.ts`
- Test: `packages/shared/test/valueObjects/DateRange.test.ts`

**Interfaces:**

- Produces:
  - `LocalDate.schema` (branded `YYYY-MM-DD`, real calendar date), `LocalDate.addDays(date, n)`,
    `LocalDate.daysBetween(from, to)`.
  - `DateRange.schema` (`{ from, to }`, `from ≤ to`, at most `MAX_SPAN_DAYS` days inclusive),
    `DateRange.MAX_SPAN_DAYS = 366`, `DateRange.checkContains(range, date)`,
    `DateRange.checkOverlaps(a, b)`; type `DateRange.DateRange`.

- [ ] **Step 1: Write the failing test**

`packages/shared/test/valueObjects/DateRange.test.ts`:

```ts
import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { DateRange, LocalDate } from '#shared/valueObjects';

const date = (value: string) => Schema.decodeUnknownSync(LocalDate.schema)(value);
const range = (from: string, to: string) =>
  Schema.decodeUnknownSync(DateRange.schema)({ from, to });

describe('LocalDate', () => {
  it('accepts a calendar date and rejects impossible ones', () => {
    expect(Schema.decodeUnknownEither(LocalDate.schema)('2026-02-28')._tag).toBe('Right');
    expect(Schema.decodeUnknownEither(LocalDate.schema)('2026-02-30')._tag).toBe('Left');
    expect(Schema.decodeUnknownEither(LocalDate.schema)('2026-2-3')._tag).toBe('Left');
    expect(Schema.decodeUnknownEither(LocalDate.schema)('2026-02-28T10:00:00Z')._tag).toBe('Left');
  });

  it('adds days across months, years and leap days', () => {
    expect(LocalDate.addDays(date('2026-12-31'), 1)).toBe('2027-01-01');
    expect(LocalDate.addDays(date('2028-03-01'), -1)).toBe('2028-02-29');
    expect(LocalDate.daysBetween(date('2026-01-01'), date('2026-12-31'))).toBe(364);
  });
});

describe('DateRange', () => {
  it('accepts a one-day range', () => {
    expect(range('2026-08-01', '2026-08-01')).toEqual({ from: '2026-08-01', to: '2026-08-01' });
  });

  it('rejects a range that ends before it starts', () => {
    expect(
      Schema.decodeUnknownEither(DateRange.schema)({ from: '2026-08-02', to: '2026-08-01' })._tag,
    ).toBe('Left');
  });

  it('accepts exactly 366 days and rejects 367', () => {
    expect(range('2027-01-01', '2028-01-01')).toBeDefined(); // 366 days inclusive
    expect(
      Schema.decodeUnknownEither(DateRange.schema)({ from: '2027-01-01', to: '2028-01-02' })._tag,
    ).toBe('Left');
  });

  it('contains its own bounds', () => {
    const august = range('2026-08-01', '2026-08-31');
    expect(DateRange.checkContains(august, date('2026-08-01'))).toBe(true);
    expect(DateRange.checkContains(august, date('2026-08-31'))).toBe(true);
    expect(DateRange.checkContains(august, date('2026-09-01'))).toBe(false);
  });

  it('overlaps a range sharing a single day, not an adjacent one', () => {
    const august = range('2026-08-01', '2026-08-31');
    expect(DateRange.checkOverlaps(august, range('2026-08-31', '2026-09-05'))).toBe(true);
    expect(DateRange.checkOverlaps(august, range('2026-09-01', '2026-09-05'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run --project shared test/valueObjects/DateRange.test.ts`
Expected: FAIL — `DateRange` / `LocalDate` not exported.

- [ ] **Step 3: Implement**

`packages/shared/src/valueObjects/LocalDate.ts`:

```ts
// A calendar date with no time and no time zone (`2026-08-14`). ISO dates compare correctly as
// strings, which the range checks and the DynamoDB sort keys rely on.

import { Schema } from 'effect';

const PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function checkIsCalendarDate(value: string): boolean {
  if (!PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export const schema = Schema.String.pipe(
  Schema.filter(checkIsCalendarDate, { message: () => 'Expected a calendar date as YYYY-MM-DD' }),
  Schema.brand('LocalDate'),
);
export type LocalDate = typeof schema.Type;

export function addDays(date: LocalDate, days: number): LocalDate {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10) as LocalDate;
}

/** Whole days from `from` to `to`; 0 for the same day. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}
```

`packages/shared/src/valueObjects/DateRange.ts`:

```ts
// An inclusive range of whole days. The span cap is what lets a store find every range
// covering a date with one bounded query: such a range starts at most MAX_SPAN_DAYS - 1 days
// before it.

import { Schema } from 'effect';

import * as LocalDate from './LocalDate';

export const MAX_SPAN_DAYS = 366;

export const schema = Schema.Struct({ from: LocalDate.schema, to: LocalDate.schema }).pipe(
  Schema.filter((range) => range.from <= range.to, {
    message: () => '`from` must not be after `to`',
  }),
  Schema.filter((range) => LocalDate.daysBetween(range.from, range.to) < MAX_SPAN_DAYS, {
    message: () => `A range covers at most ${MAX_SPAN_DAYS} days`,
  }),
);
export type DateRange = typeof schema.Type;

export const checkContains = (range: DateRange, date: LocalDate.LocalDate) =>
  range.from <= date && date <= range.to;

export const checkOverlaps = (a: DateRange, b: DateRange) => a.from <= b.to && b.from <= a.to;
```

Add to `index.ts`: `export * as DateRange from './DateRange';` and `export * as LocalDate from './LocalDate';`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run --project shared`
Expected: PASS.

- [ ] **Step 5: Build shared, since other packages consume its build output**

Run: `pnpm --filter @chordcraft/shared build && pnpm --filter @chordcraft/shared typecheck`
Expected: exit 0, `packages/shared/build/valueObjects/DateRange.js` exists.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/valueObjects packages/shared/test/valueObjects
git commit -m "feat(shared): add local dates and bounded date ranges"
```

---

### Task 6: Pass the verified email from Clerk through the authorizer

**Files:**

- Create: `packages/api-auth/src/claims.ts`
- Modify: `packages/api-auth/src/utils.ts` (the `AuthContextObject` interface)
- Modify: `packages/api-auth/src/index.ts`
- Create: `packages/api-auth/test/claims.test.ts`
- Modify: `packages/api-auth/test/index.test.ts`
- Modify: `packages/deployment/README.md` (Clerk configuration section)

**Interfaces:**

- Produces: `AuthContextObject` = `{ userId: string; tenantId: string; email: string;
emailVerified: 'true' | 'false' }`. AppSync's `resolverContext` carries flat string values
  only, hence the string flag. `email` is `''` when the claim is absent. `readEmailClaims(payload:
object): Pick<AuthContextObject, 'email' | 'emailVerified'>`.

- [ ] **Step 1: Write the failing tests**

`packages/api-auth/test/claims.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { readEmailClaims } from '#api-auth/claims';

describe('readEmailClaims', () => {
  it('normalises the email and reports a verified address', () => {
    expect(readEmailClaims({ email: ' Ana@Example.com ', email_verified: true })).toEqual({
      email: 'ana@example.com',
      emailVerified: 'true',
    });
  });

  it('returns an empty email when the claim is missing or null', () => {
    expect(readEmailClaims({})).toEqual({ email: '', emailVerified: 'false' });
    expect(readEmailClaims({ email: null, email_verified: null })).toEqual({
      email: '',
      emailVerified: 'false',
    });
  });

  it('fails closed: only the boolean true counts as verified', () => {
    expect(readEmailClaims({ email: 'a@b.co', email_verified: 'true' }).emailVerified).toBe(
      'false',
    );
    expect(readEmailClaims({ email: 'a@b.co' }).emailVerified).toBe('false');
  });
});
```

In `packages/api-auth/test/index.test.ts`, replace the test
`'authorizes a valid token and maps sub to both userId and tenantId'` with:

```ts
it('authorizes a valid token and maps sub to both userId and tenantId', async () => {
  vi.mocked(verifyToken).mockResolvedValue({ sub: 'user_123' } as never);

  const result = await handler(makeEvent('Bearer good.jwt.token'));

  expect(result.isAuthorized).toBe(true);
  expect(result.resolverContext).toEqual({
    userId: 'user_123',
    tenantId: 'user_123',
    email: '',
    emailVerified: 'false',
  });
  expect(result.ttlOverride).toBe(300);
});

it('passes the email claims through to the resolver context', async () => {
  vi.mocked(verifyToken).mockResolvedValue({
    sub: 'user_123',
    email: 'Ana@Example.com',
    email_verified: true,
  } as never);

  const result = await handler(makeEvent('Bearer good.jwt.token'));

  expect(result.resolverContext).toMatchObject({
    email: 'ana@example.com',
    emailVerified: 'true',
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run --project api-auth`
Expected: FAIL — `#api-auth/claims` cannot be resolved; the context has no `email`.

- [ ] **Step 3: Implement**

`packages/api-auth/src/claims.ts`:

```ts
import type { AuthContextObject } from './utils';

/**
 * Reads the custom session claims configured in the Clerk dashboard (Sessions → Customize session
 * token): `email` and `email_verified`. Clerk's default token carries neither. Anything but the
 * boolean `true` counts as unverified, so a missing template fails closed.
 */
export function readEmailClaims(
  payload: object,
): Pick<AuthContextObject, 'email' | 'emailVerified'> {
  const email =
    'email' in payload && typeof payload.email === 'string'
      ? payload.email.trim().toLowerCase()
      : '';
  const isVerified = email !== '' && 'email_verified' in payload && payload.email_verified === true;
  return { email, emailVerified: isVerified ? 'true' : 'false' };
}
```

In `packages/api-auth/src/utils.ts`, replace `AuthContextObject` with:

```ts
/** AppSync's resolverContext is a flat map of strings, hence `emailVerified` as a string. */
export interface AuthContextObject {
  userId: string;
  tenantId: string;
  email: string;
  emailVerified: 'true' | 'false';
}
```

In `packages/api-auth/src/index.ts`, import `readEmailClaims` from `'./claims'` and build the
context as:

```ts
const context: AuthContextObject = {
  userId: verified.sub,
  tenantId: verified.sub,
  ...readEmailClaims(verified),
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run --project api-auth`
Expected: PASS.

- [ ] **Step 5: Document the Clerk configuration**

Append to `packages/deployment/README.md`:

````md
## Clerk configuration

The authorizer reads two custom claims that Clerk's default session token does not carry. In
the Clerk dashboard (both the development and the production instance): **Sessions →
Customize session token**, and set:

```json
{
  "email": "{{user.primary_email_address}}",
  "email_verified": "{{user.email_verified}}"
}
```

Check the preview shows `email_verified` as a boolean. If it shows `null`, every user is
treated as unverified: profiles still work, but accepting a band invitation (phase 5) is
refused. Without `email`, saving a profile fails with a `VALIDATION` error on `email`.
````

- [ ] **Step 6: Commit**

```bash
git add packages/api-auth packages/deployment/README.md
git commit -m "feat(api-auth): pass the caller's email and its verification to resolvers"
```

- [ ] **Step 7: Manual — configure Clerk**

Ask the user to apply the dashboard setting from Step 5 to the development instance before
Task 14's deployment. This is a dashboard change; it cannot be scripted from the repo.

---

# Phase 1 — musician profiles

### Task 7: `context-user` package and the `MusicianProfile` entity

**Files:**

- Replace: `packages/context-user/package.json`, `tsconfig.json`, `tsconfig.build.json`,
  `tsconfig.test.json`, `vitest.config.ts`
- Create: `packages/context-user/vitest.config.integration.ts`
- Delete: `packages/context-user/src/application/commands/index.ts`,
  `packages/context-user/src/application/queries/index.ts` (`export default {}` stubs)
- Create: `packages/context-user/src/index.ts`, `src/domain/index.ts`,
  `src/domain/errors/{index,UserError}.ts`, `src/domain/valueObjects/{index,Profile.schema}.ts`,
  `src/domain/MusicianProfile.ts`
- Modify (root): `tsconfig.build.json`, `vitest.config.ts`, `vitest.shared.ts`, `knip.jsonc`
- Test: `packages/context-user/test/domain/MusicianProfile.test.ts`

**Interfaces:**

- Consumes: Tasks 1–5 value objects.
- Produces:
  - `ProfileFieldsSchema` (the editable fields), type `ProfileFields`; `RoleTagSchema`,
    `StyleTagSchema`, `RegionSchema`.
  - `class MusicianProfile` (a `Schema.Class`: `...ProfileFields`, `userId: UserID`,
    `email: Email`, `version: number`, `createdAt: Date`, `updatedAt: Date`; encodes dates as
    ISO strings) with `static save(params: SaveProfileParams): Effect<MusicianProfile,
ProfileRuleViolation>`.
  - Errors: `ProfileRuleViolation { rule: ProfileRule }`, `UnavailabilityNotFound { id }`,
    `ConcurrentModification { entity }`, `UserReadError`, `UserWriteError`, `UserParseError`
    (`{ reason: unknown }`), union type `UserError`, `PROFILE_RULES`, type `ProfileRule`.

- [ ] **Step 1: Configure the package like `context-chart`**

`packages/context-user/package.json`:

```json
{
  "name": "@chordcraft/context-user",
  "version": "1.0.0",
  "description": "The User bounded context: musician profiles and unavailability",
  "keywords": [],
  "license": "ISC",
  "author": "Speira",
  "imports": {
    "#context-user/*": "./src/*"
  },
  "exports": {
    ".": {
      "types": "./build/index.d.ts",
      "import": "./build/index.js",
      "require": "./build/index.js"
    }
  },
  "main": "./build/index.js",
  "types": "./build/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "check": "tsc -b tsconfig.json --noEmit",
    "test": "vitest",
    "test:integration": "vitest --config vitest.config.integration.ts",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.948.0",
    "@aws-sdk/lib-dynamodb": "^3.948.0",
    "@chordcraft/shared": "workspace:*",
    "effect": "^3.19.12",
    "ulid": "^3.0.2"
  },
  "devDependencies": {
    "@types/node": "^22.19.2",
    "vitest": "^4.0.9"
  }
}
```

Copy these files verbatim from `packages/context-chart/` into `packages/context-user/`:
`tsconfig.json`, `tsconfig.build.json`, `tsconfig.test.json`, `vitest.config.ts`,
`vitest.config.integration.ts`. They contain no package name, so no edit is needed.

Delete the two stubs:

```bash
git rm packages/context-user/src/application/commands/index.ts packages/context-user/src/application/queries/index.ts
```

Root wiring:

- `tsconfig.build.json`: add `{ "path": "packages/context-user/tsconfig.build.json" }` to
  `references`, after `context-chart`.
- `vitest.shared.ts`: add
  `'@chordcraft/context-user': path.join(__dirname, 'packages/context-user/src'),`.
- `vitest.config.ts`: add `project('context-user'),` after `project('context-chart'),`.
- `knip.jsonc`: delete the line
  `"packages/context-user/src/application/**" // context not started`.

Run: `pnpm install`
Expected: exit 0; `packages/context-user/node_modules/@chordcraft/shared` is linked.

- [ ] **Step 2: Write the failing test**

`packages/context-user/test/domain/MusicianProfile.test.ts`:

```ts
import { Effect, Either, Option, Schema } from 'effect';

import { Email, UserID } from '@chordcraft/shared/valueObjects';
import { describe, expect, it } from 'vitest';

import { MusicianProfile } from '#context-user/domain/MusicianProfile';
import { type ProfileFields, ProfileFieldsSchema } from '#context-user/domain/valueObjects';

const USER_ID = UserID.schema.make('user_ana');
const EMAIL = Schema.decodeUnknownSync(Email.schema)('ana@example.com');
const NOW = new Date('2026-09-30T10:00:00.000Z');

function fields(overrides: Record<string, unknown> = {}): ProfileFields {
  return Schema.decodeUnknownSync(ProfileFieldsSchema)({
    name: 'Ana Lopez',
    phone: '+33612345678',
    preferredChannel: 'WHATSAPP',
    region: { country: 'FR', area: 'Île-de-France' },
    roles: [{ role: 'bass', isPrimary: true, level: 'PROFESSIONAL' }],
    styles: [{ style: 'funk' }],
    ...overrides,
  });
}

function save(profileFields: ProfileFields, existing = Option.none<MusicianProfile>()) {
  return Effect.runSync(
    Effect.either(
      MusicianProfile.save({
        existing,
        userId: USER_ID,
        email: EMAIL,
        fields: profileFields,
        now: NOW,
      }),
    ),
  );
}

describe('MusicianProfile.save', () => {
  it('creates version 1 with the email from Clerk', () => {
    const result = save(fields());
    const profile = Either.getOrThrow(result);

    expect(profile.version).toBe(1);
    expect(profile.email).toBe('ana@example.com');
    expect(profile.createdAt).toEqual(NOW);
    expect(profile.updatedAt).toEqual(NOW);
  });

  it('bumps the version and keeps createdAt on update', () => {
    const first = Either.getOrThrow(save(fields()));
    const later = new Date('2026-10-01T10:00:00.000Z');

    const second = Effect.runSync(
      MusicianProfile.save({
        existing: Option.some(first),
        userId: USER_ID,
        email: EMAIL,
        fields: fields({ name: 'Ana L.' }),
        now: later,
      }),
    );

    expect(second.version).toBe(2);
    expect(second.name).toBe('Ana L.');
    expect(second.createdAt).toEqual(NOW);
    expect(second.updatedAt).toEqual(later);
  });

  it('requires a phone for every channel but email', () => {
    const { phone: _phone, ...withoutPhone } = fields();
    const result = save(fields({ ...withoutPhone, preferredChannel: 'SMS' }));

    expect(result).toEqual(
      Either.left(expect.objectContaining({ rule: 'PHONE_REQUIRED_FOR_CHANNEL' })),
    );
  });

  it.each([
    [
      'DUPLICATE_ROLE',
      {
        roles: [
          { role: 'bass', isPrimary: true },
          { role: 'bass', isPrimary: false },
        ],
      },
    ],
    [
      'SINGLE_PRIMARY_ROLE',
      {
        roles: [
          { role: 'bass', isPrimary: true },
          { role: 'guitar', isPrimary: true },
        ],
      },
    ],
    ['DUPLICATE_STYLE', { styles: [{ style: 'funk' }, { style: 'funk' }] }],
    ['DETAIL_REQUIRED_FOR_OTHER', { roles: [{ role: 'other', isPrimary: true }] }],
    ['DETAIL_ONLY_FOR_OTHER', { styles: [{ style: 'jazz', detail: 'bebop' }] }],
  ])('rejects %s', (rule, overrides) => {
    expect(save(fields(overrides))).toEqual(Either.left(expect.objectContaining({ rule })));
  });

  it('allows several "other" roles with different details', () => {
    const result = save(
      fields({
        roles: [
          { role: 'other', detail: 'accordion', isPrimary: true },
          { role: 'other', detail: 'harp', isPrimary: false },
        ],
      }),
    );

    expect(Either.isRight(result)).toBe(true);
  });

  it('allows no phone when the channel is email', () => {
    const { phone: _phone, ...withoutPhone } = fields();
    const result = save(fields({ ...withoutPhone, preferredChannel: 'EMAIL' }));

    expect(Either.isRight(result)).toBe(true);
  });
});

describe('MusicianProfile record', () => {
  it('round-trips through its encoded form, ignoring store attributes', () => {
    const profile = Either.getOrThrow(save(fields()));
    const record = {
      PK: 'USER#user_ana',
      SK: 'PROFILE',
      ...Schema.encodeSync(MusicianProfile)(profile),
    };

    expect(record.createdAt).toBe('2026-09-30T10:00:00.000Z');
    expect(Schema.decodeUnknownSync(MusicianProfile)(record)).toEqual(profile);
  });
});

describe('ProfileFieldsSchema', () => {
  it('requires between 1 and 10 roles', () => {
    const decode = Schema.decodeUnknownEither(ProfileFieldsSchema);
    expect(decode({ ...fields(), roles: [] })._tag).toBe('Left');
  });

  it('trims the name and rejects a blank one', () => {
    expect(fields({ name: '  Ana  ' }).name).toBe('Ana');
    expect(Schema.decodeUnknownEither(ProfileFieldsSchema)({ ...fields(), name: '   ' })._tag).toBe(
      'Left',
    );
  });
});
```

> `fields(...)` spreads a decoded profile back into the decoder, so tests that drop `phone`
> destructure it away: an explicit `phone: undefined` is not "absent" under
> `exactOptionalPropertyTypes`.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run --project context-user`
Expected: FAIL — `#context-user/domain/MusicianProfile` cannot be resolved.

- [ ] **Step 4: Implement the errors**

`packages/context-user/src/domain/errors/UserError.ts`:

```ts
import { Schema } from 'effect';

export const PROFILE_RULES = [
  'PHONE_REQUIRED_FOR_CHANNEL',
  'DUPLICATE_ROLE',
  'SINGLE_PRIMARY_ROLE',
  'DUPLICATE_STYLE',
  'DETAIL_REQUIRED_FOR_OTHER',
  'DETAIL_ONLY_FOR_OTHER',
] as const;
export type ProfileRule = (typeof PROFILE_RULES)[number];

export type UserError =
  | ProfileRuleViolation
  | UnavailabilityNotFound
  | ConcurrentModification
  | UserReadError
  | UserWriteError
  | UserParseError;

/** A rule spanning several fields; single-field rules are schema errors. */
export class ProfileRuleViolation extends Schema.TaggedError<ProfileRuleViolation>()(
  'ProfileRuleViolation',
  { rule: Schema.Literal(...PROFILE_RULES) },
) {}

export class UnavailabilityNotFound extends Schema.TaggedError<UnavailabilityNotFound>()(
  'UnavailabilityNotFound',
  { id: Schema.String },
) {}

/** The stored version moved on since it was read. */
export class ConcurrentModification extends Schema.TaggedError<ConcurrentModification>()(
  'ConcurrentModification',
  { entity: Schema.String },
) {}

export class UserReadError extends Schema.TaggedError<UserReadError>()('UserReadError', {
  reason: Schema.Unknown,
}) {}

export class UserWriteError extends Schema.TaggedError<UserWriteError>()('UserWriteError', {
  reason: Schema.Unknown,
}) {}

/** A stored record that no longer decodes. */
export class UserParseError extends Schema.TaggedError<UserParseError>()('UserParseError', {
  reason: Schema.Unknown,
}) {}
```

`packages/context-user/src/domain/errors/index.ts`: `export * from './UserError';`

- [ ] **Step 5: Implement the profile schema and entity**

`packages/context-user/src/domain/valueObjects/Profile.schema.ts`:

```ts
import { Schema } from 'effect';

import {
  ContactChannel,
  CountryCode,
  MusicianRole,
  MusicStyle,
  PhoneNumber,
  SkillLevel,
} from '@chordcraft/shared/valueObjects';

const trimmed = (max: number) => Schema.Trim.pipe(Schema.minLength(1), Schema.maxLength(max));

/** Free text qualifying an `other` role or style, e.g. "accordion". */
const Detail = trimmed(40);

export const RoleTagSchema = Schema.Struct({
  role: MusicianRole.schema,
  detail: Schema.optionalWith(Detail, { exact: true }),
  isPrimary: Schema.Boolean,
  level: Schema.optionalWith(SkillLevel.schema, { exact: true }),
});
export type RoleTag = typeof RoleTagSchema.Type;

export const StyleTagSchema = Schema.Struct({
  style: MusicStyle.schema,
  detail: Schema.optionalWith(Detail, { exact: true }),
});
export type StyleTag = typeof StyleTagSchema.Type;

export const RegionSchema = Schema.Struct({
  country: CountryCode.schema,
  area: Schema.optionalWith(trimmed(100), { exact: true }),
});

/** What the musician edits. The email comes from Clerk and is not part of it. */
export const ProfileFieldsSchema = Schema.Struct({
  name: trimmed(100),
  phone: Schema.optionalWith(PhoneNumber.schema, { exact: true }),
  preferredChannel: ContactChannel.schema,
  region: Schema.optionalWith(RegionSchema, { exact: true }),
  roles: Schema.Array(RoleTagSchema).pipe(Schema.minItems(1), Schema.maxItems(10)),
  styles: Schema.Array(StyleTagSchema).pipe(Schema.maxItems(20)),
});
export type ProfileFields = typeof ProfileFieldsSchema.Type;
```

`packages/context-user/src/domain/valueObjects/index.ts`:

```ts
export * from './Profile.schema';
```

`packages/context-user/src/domain/MusicianProfile.ts`:

```ts
import { Effect, type Option, Schema } from 'effect';

import { ContactChannel, Email, MusicianRole, UserID } from '@chordcraft/shared/valueObjects';

import { type ProfileRule, ProfileRuleViolation } from './errors';
import { type ProfileFields, ProfileFieldsSchema } from './valueObjects/Profile.schema';

interface SaveProfileParams {
  existing: Option.Option<MusicianProfile>;
  userId: UserID.UserID;
  email: Email.Email;
  fields: ProfileFields;
  now: Date;
}

interface Tag {
  slug: string;
  detail?: string;
}

const tagKey = (tag: Tag) => `${tag.slug}#${tag.detail?.toLowerCase() ?? ''}`;

const checkHasDuplicates = (tags: ReadonlyArray<Tag>) =>
  new Set(tags.map((tag) => tagKey(tag))).size !== tags.length;

function findRuleViolation(fields: ProfileFields): ProfileRule | undefined {
  const roles = fields.roles.map((tag) => ({
    slug: tag.role,
    ...(tag.detail ? { detail: tag.detail } : {}),
  }));
  const styles = fields.styles.map((tag) => ({
    slug: tag.style,
    ...(tag.detail ? { detail: tag.detail } : {}),
  }));
  const tags = [...roles, ...styles];

  if (ContactChannel.checkRequiresPhone(fields.preferredChannel) && fields.phone === undefined) {
    return 'PHONE_REQUIRED_FOR_CHANNEL';
  }
  if (tags.some((tag) => tag.slug === MusicianRole.OTHER && tag.detail === undefined)) {
    return 'DETAIL_REQUIRED_FOR_OTHER';
  }
  if (tags.some((tag) => tag.slug !== MusicianRole.OTHER && tag.detail !== undefined)) {
    return 'DETAIL_ONLY_FOR_OTHER';
  }
  if (checkHasDuplicates(roles)) return 'DUPLICATE_ROLE';
  if (fields.roles.filter((tag) => tag.isPrimary).length > 1) return 'SINGLE_PRIMARY_ROLE';
  if (checkHasDuplicates(styles)) return 'DUPLICATE_STYLE';
  return undefined;
}

/**
 * A musician's profile. State-stored: `version` increases by one on every save and guards the write
 * (optimistic concurrency). Encoding turns the dates into ISO strings for the store.
 */
export class MusicianProfile extends Schema.Class<MusicianProfile>('MusicianProfile')({
  ...ProfileFieldsSchema.fields,
  userId: UserID.schema,
  email: Email.schema,
  version: Schema.Int.pipe(Schema.positive()),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {
  /** The first version of a profile, or the next version of `existing`. */
  static save(params: SaveProfileParams): Effect.Effect<MusicianProfile, ProfileRuleViolation> {
    const rule = findRuleViolation(params.fields);
    if (rule !== undefined) return Effect.fail(new ProfileRuleViolation({ rule }));

    const { email, existing, fields, now, userId } = params;
    const previous = existing._tag === 'Some' ? existing.value : undefined;
    return Effect.succeed(
      new MusicianProfile({
        ...fields,
        userId,
        email,
        version: (previous?.version ?? 0) + 1,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
      }),
    );
  }
}
```

`packages/context-user/src/domain/index.ts`:

```ts
export * from './errors';
export * from './MusicianProfile';
export * from './valueObjects';
```

`packages/context-user/src/index.ts`:

```ts
export * as UserDomain from './domain';
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm vitest run --project context-user`
Expected: PASS.

- [ ] **Step 7: Type-check and lint the package**

Run: `pnpm --filter @chordcraft/context-user typecheck && pnpm eslint packages/context-user`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add packages/context-user tsconfig.build.json vitest.config.ts vitest.shared.ts knip.jsonc pnpm-lock.yaml
git commit -m "feat(context-user): add the musician profile entity and its rules"
```

---

### Task 8: `Unavailability`, the repository port and an in-memory adapter

**Files:**

- Create: `packages/context-user/src/domain/valueObjects/UnavailabilityID.ts`,
  `src/domain/valueObjects/Unavailability.schema.ts`
- Modify: `packages/context-user/src/domain/valueObjects/index.ts`, `src/domain/index.ts`
- Create: `packages/context-user/src/domain/Unavailability.ts`,
  `src/domain/UserRepository.ts`
- Create: `packages/context-user/src/infrastructure/memory/{index,InMemoryUserRepository}.ts`,
  `src/infrastructure/index.ts`
- Modify: `packages/context-user/src/index.ts`
- Test: `packages/context-user/test/domain/Unavailability.test.ts`,
  `test/infrastructure-memory/InMemoryUserRepository.test.ts`

> The in-memory adapter lives in `src/`, not `test/`: tests in other folders import it through
> the `#context-user/*` alias, since `../` imports are forbidden. It is also a working adapter
> for local development. Its test sits in `test/infrastructure-memory/` because
> `test/infrastructure/**` is reserved for the DynamoDB integration suite.

**Interfaces:**

- Consumes: `MusicianProfile`, errors (Task 7); `BandID`, `DateRange`, `LocalDate`, `UserID`
  (Tasks 3, 5).
- Produces:
  - `UnavailabilityID.{schema, generate}` (ULID), `ScopeSchema` (`'ALL' | { bandIds:
NonEmptyArray<BandID> }`), `UnavailabilityFieldsSchema` (`{ range, reason?, scope }`), type
    `UnavailabilityFields`.
  - `class Unavailability` (`Schema.Class`: `...UnavailabilityFields`, `id`, `userId`),
    `static create({ id, userId, fields }): Unavailability` (dedupes band ids),
    `checkAppliesTo(bandId, date): boolean`.
  - `interface UserRepository` + `UserRepository` tag:
    `findProfile(userId) → Option<MusicianProfile>`, `saveProfile(profile) → void`
    (ConcurrentModification unless the stored version is `profile.version - 1`, or absent for
    version 1), `findUnavailability(userId, id) → Option<Unavailability>`,
    `listUnavailability(userId, range) → ReadonlyArray<Unavailability>` (overlapping `range`,
    earliest first), `saveUnavailability(entry) → void`, `deleteUnavailability(entry) → void`.
    All fail with `UserError`.
  - `class InMemoryUserRepository implements UserRepository` with the same semantics.

- [ ] **Step 1: Write the failing tests**

`packages/context-user/test/domain/Unavailability.test.ts`:

```ts
import { Schema } from 'effect';

import { BandID, LocalDate, UserID } from '@chordcraft/shared/valueObjects';
import { describe, expect, it } from 'vitest';

import { Unavailability } from '#context-user/domain/Unavailability';
import { UnavailabilityFieldsSchema, UnavailabilityID } from '#context-user/domain/valueObjects';

const BAND_A = BandID.schema.make('band_0f6c2c3e-1d4b-4c9a-9a0e-2b7c1d9e8f00');
const BAND_B = BandID.schema.make('band_1a2b3c4d-1d4b-4c9a-9a0e-2b7c1d9e8f00');
const date = (value: string) => LocalDate.schema.make(value);

function entry(scope: unknown) {
  return Unavailability.create({
    id: UnavailabilityID.generate(),
    userId: UserID.schema.make('user_ana'),
    fields: Schema.decodeUnknownSync(UnavailabilityFieldsSchema)({
      range: { from: '2026-08-01', to: '2026-08-15' },
      reason: 'holiday',
      scope,
    }),
  });
}

describe('Unavailability', () => {
  it('applies to every band when scoped to ALL', () => {
    const holiday = entry('ALL');
    expect(holiday.checkAppliesTo(BAND_A, date('2026-08-10'))).toBe(true);
    expect(holiday.checkAppliesTo(BAND_B, date('2026-08-10'))).toBe(true);
  });

  it('applies only to the listed bands otherwise', () => {
    const scoped = entry({ bandIds: [BAND_A] });
    expect(scoped.checkAppliesTo(BAND_A, date('2026-08-10'))).toBe(true);
    expect(scoped.checkAppliesTo(BAND_B, date('2026-08-10'))).toBe(false);
  });

  it('does not apply outside its range', () => {
    expect(entry('ALL').checkAppliesTo(BAND_A, date('2026-08-16'))).toBe(false);
  });

  it('dedupes band ids', () => {
    const scoped = entry({ bandIds: [BAND_A, BAND_A] });
    expect(scoped.scope).toEqual({ bandIds: [BAND_A] });
  });

  it('rejects an empty band list: no bands means scope ALL', () => {
    expect(
      Schema.decodeUnknownEither(UnavailabilityFieldsSchema)({
        range: { from: '2026-08-01', to: '2026-08-15' },
        scope: { bandIds: [] },
      })._tag,
    ).toBe('Left');
  });
});
```

`packages/context-user/test/infrastructure-memory/InMemoryUserRepository.test.ts`:

```ts
import { Effect, Either, Option, Schema } from 'effect';

import { DateRange, Email, UserID } from '@chordcraft/shared/valueObjects';
import { describe, expect, it } from 'vitest';

import { MusicianProfile } from '#context-user/domain/MusicianProfile';
import { Unavailability } from '#context-user/domain/Unavailability';
import {
  ProfileFieldsSchema,
  UnavailabilityFieldsSchema,
  UnavailabilityID,
} from '#context-user/domain/valueObjects';
import { InMemoryUserRepository } from '#context-user/infrastructure/memory';

const USER_ID = UserID.schema.make('user_ana');
const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runSync(Effect.either(effect));

function profile(version: number) {
  return new MusicianProfile({
    ...Schema.decodeUnknownSync(ProfileFieldsSchema)({
      name: 'Ana',
      preferredChannel: 'EMAIL',
      roles: [{ role: 'bass', isPrimary: true }],
      styles: [],
    }),
    userId: USER_ID,
    email: Schema.decodeUnknownSync(Email.schema)('ana@example.com'),
    version,
    createdAt: new Date('2026-09-30T00:00:00Z'),
    updatedAt: new Date('2026-09-30T00:00:00Z'),
  });
}

function unavailability(from: string, to: string) {
  return Unavailability.create({
    id: UnavailabilityID.generate(),
    userId: USER_ID,
    fields: Schema.decodeUnknownSync(UnavailabilityFieldsSchema)({
      range: { from, to },
      scope: 'ALL',
    }),
  });
}

describe('InMemoryUserRepository', () => {
  it('accepts versions in sequence and refuses a stale one', () => {
    const repository = new InMemoryUserRepository();
    expect(Either.isRight(run(repository.saveProfile(profile(1))))).toBe(true);
    expect(Either.isRight(run(repository.saveProfile(profile(2))))).toBe(true);
    expect(run(repository.saveProfile(profile(2)))).toEqual(
      Either.left(expect.objectContaining({ _tag: 'ConcurrentModification' })),
    );
  });

  it('lists the entries overlapping a range, earliest first', () => {
    const repository = new InMemoryUserRepository();
    const late = unavailability('2026-08-20', '2026-08-25');
    const early = unavailability('2026-08-01', '2026-08-05');
    const outside = unavailability('2026-09-01', '2026-09-05');
    for (const item of [late, early, outside]) run(repository.saveUnavailability(item));

    const listed = Effect.runSync(
      repository.listUnavailability(
        USER_ID,
        Schema.decodeUnknownSync(DateRange.schema)({ from: '2026-08-01', to: '2026-08-31' }),
      ),
    );

    expect(listed.map((item) => item.id)).toEqual([early.id, late.id]);
    expect(Effect.runSync(repository.findProfile(USER_ID))).toEqual(Option.none());
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run --project context-user`
Expected: FAIL — `#context-user/domain/Unavailability` and
`#context-user/infrastructure/memory` cannot be resolved.

- [ ] **Step 3: Implement the value objects and the entity**

`packages/context-user/src/domain/valueObjects/UnavailabilityID.ts`:

```ts
import { Schema } from 'effect';

import { isValid, ulid } from 'ulid';

export const schema = Schema.String.pipe(
  Schema.filter((value) => isValid(value), { message: () => 'Expected a valid ULID' }),
  Schema.brand('UnavailabilityID'),
);
export type UnavailabilityID = typeof schema.Type;

export const generate = () => ulid() as UnavailabilityID;
```

`packages/context-user/src/domain/valueObjects/Unavailability.schema.ts`:

```ts
import { Schema } from 'effect';

import { BandID, DateRange } from '@chordcraft/shared/valueObjects';

/** `ALL` blocks every band; a band list blocks only those bands. */
export const ScopeSchema = Schema.Union(
  Schema.Literal('ALL'),
  Schema.Struct({ bandIds: Schema.NonEmptyArray(BandID.schema).pipe(Schema.maxItems(50)) }),
);
export type Scope = typeof ScopeSchema.Type;

export const UnavailabilityFieldsSchema = Schema.Struct({
  range: DateRange.schema,
  reason: Schema.optionalWith(Schema.Trim.pipe(Schema.minLength(1), Schema.maxLength(100)), {
    exact: true,
  }),
  scope: ScopeSchema,
});
export type UnavailabilityFields = typeof UnavailabilityFieldsSchema.Type;
```

Replace `packages/context-user/src/domain/valueObjects/index.ts` with:

```ts
export * from './Profile.schema';
export * from './Unavailability.schema';
export * as UnavailabilityID from './UnavailabilityID';
```

`packages/context-user/src/domain/Unavailability.ts`:

```ts
import { Array as Arr, Schema } from 'effect';

import { type BandID, DateRange, type LocalDate, UserID } from '@chordcraft/shared/valueObjects';

import {
  type Scope,
  type UnavailabilityFields,
  UnavailabilityFieldsSchema,
} from './valueObjects/Unavailability.schema';
import * as UnavailabilityID from './valueObjects/UnavailabilityID';

interface CreateUnavailabilityParams {
  id: UnavailabilityID.UnavailabilityID;
  userId: UserID.UserID;
  fields: UnavailabilityFields;
}

const normalizeScope = (scope: Scope): Scope =>
  scope === 'ALL' ? scope : { bandIds: Arr.dedupe(scope.bandIds) };

/** Whole days a musician cannot play, for every band (`ALL`) or for chosen ones. */
export class Unavailability extends Schema.Class<Unavailability>('Unavailability')({
  ...UnavailabilityFieldsSchema.fields,
  id: UnavailabilityID.schema,
  userId: UserID.schema,
}) {
  static create(params: CreateUnavailabilityParams): Unavailability {
    const { fields, id, userId } = params;
    return new Unavailability({ ...fields, scope: normalizeScope(fields.scope), id, userId });
  }

  /** True when this entry blocks `date` for `bandId`. */
  checkAppliesTo(bandId: BandID.BandID, date: LocalDate.LocalDate): boolean {
    return (
      DateRange.checkContains(this.range, date) &&
      (this.scope === 'ALL' || this.scope.bandIds.includes(bandId))
    );
  }
}
```

`packages/context-user/src/domain/UserRepository.ts`:

```ts
import { Context, type Effect, type Option } from 'effect';

import type { DateRange, UserID } from '@chordcraft/shared/valueObjects';

import type { UserError } from './errors';
import type { MusicianProfile } from './MusicianProfile';
import type { Unavailability } from './Unavailability';
import type { UnavailabilityID } from './valueObjects';

export interface UserRepository {
  readonly findProfile: (
    userId: UserID.UserID,
  ) => Effect.Effect<Option.Option<MusicianProfile>, UserError>;

  /**
   * Writes the profile if the stored one is `profile.version - 1` (or absent, for version 1); fails
   * with `ConcurrentModification` otherwise.
   */
  readonly saveProfile: (profile: MusicianProfile) => Effect.Effect<void, UserError>;

  readonly findUnavailability: (
    userId: UserID.UserID,
    id: UnavailabilityID.UnavailabilityID,
  ) => Effect.Effect<Option.Option<Unavailability>, UserError>;

  /** The entries overlapping `range`, earliest first. */
  readonly listUnavailability: (
    userId: UserID.UserID,
    range: DateRange.DateRange,
  ) => Effect.Effect<ReadonlyArray<Unavailability>, UserError>;

  /** Creates or replaces the entry with this id (last write wins: only its owner edits it). */
  readonly saveUnavailability: (entry: Unavailability) => Effect.Effect<void, UserError>;

  readonly deleteUnavailability: (entry: Unavailability) => Effect.Effect<void, UserError>;
}

export const UserRepository = Context.GenericTag<UserRepository>('UserRepository');
```

Replace `packages/context-user/src/domain/index.ts` with:

```ts
export * from './errors';
export * from './MusicianProfile';
export * from './Unavailability';
export * from './UserRepository';
export * from './valueObjects';
```

- [ ] **Step 4: Implement the in-memory adapter**

`packages/context-user/src/infrastructure/memory/InMemoryUserRepository.ts`:

```ts
import { Effect, Option } from 'effect';

import { DateRange, type UserID } from '@chordcraft/shared/valueObjects';

import {
  ConcurrentModification,
  type MusicianProfile,
  type Unavailability,
  type UnavailabilityID,
  type UserRepository,
} from '#context-user/domain';

/** Same semantics as the DynamoDB adapter, including version conflicts. */
export class InMemoryUserRepository implements UserRepository {
  private readonly profiles = new Map<string, MusicianProfile>();
  private readonly entries = new Map<string, Unavailability>();
  private readonly entryKey = (userId: string, id: string) => `${userId}#${id}`;

  findProfile(userId: UserID.UserID) {
    return Effect.sync(() => Option.fromNullable(this.profiles.get(userId)));
  }

  saveProfile(profile: MusicianProfile) {
    return Effect.suspend(() => {
      const storedVersion = this.profiles.get(profile.userId)?.version ?? 0;
      if (storedVersion !== profile.version - 1) {
        return Effect.fail(new ConcurrentModification({ entity: 'MusicianProfile' }));
      }
      this.profiles.set(profile.userId, profile);
      return Effect.void;
    });
  }

  findUnavailability(userId: UserID.UserID, id: UnavailabilityID.UnavailabilityID) {
    return Effect.sync(() => Option.fromNullable(this.entries.get(this.entryKey(userId, id))));
  }

  listUnavailability(userId: UserID.UserID, range: DateRange.DateRange) {
    return Effect.sync(() =>
      [...this.entries.values()]
        .filter((entry) => entry.userId === userId && DateRange.checkOverlaps(entry.range, range))
        .toSorted((a, b) => a.range.from.localeCompare(b.range.from)),
    );
  }

  saveUnavailability(entry: Unavailability) {
    return Effect.sync(() => {
      this.entries.set(this.entryKey(entry.userId, entry.id), entry);
    });
  }

  deleteUnavailability(entry: Unavailability) {
    return Effect.sync(() => {
      this.entries.delete(this.entryKey(entry.userId, entry.id));
    });
  }
}
```

`packages/context-user/src/infrastructure/memory/index.ts`: `export * from './InMemoryUserRepository';`

`packages/context-user/src/infrastructure/index.ts`: `export * as memory from './memory';`

Replace `packages/context-user/src/index.ts` with:

```ts
export * as UserDomain from './domain';
export * as UserInfrastructure from './infrastructure';
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run --project context-user`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/context-user
git commit -m "feat(context-user): add unavailability, the user repository port and an in-memory adapter"
```

---

### Task 9: Save and read my profile (application)

**Files:**

- Create: `packages/context-user/src/application/commands/SaveMyProfile/{index,SaveMyProfileCommand,SaveMyProfileHandler}.ts`
- Create: `packages/context-user/src/application/queries/GetMyProfile/{index,GetMyProfileQuery,GetMyProfileHandler}.ts`
- Create: `packages/context-user/src/application/{index,commands/index,queries/index}.ts`
- Modify: `packages/context-user/src/index.ts`
- Test: `packages/context-user/test/application/commands/SaveMyProfileHandler.test.ts`,
  `test/application/queries/GetMyProfileHandler.test.ts`

**Interfaces:**

- Consumes: `MusicianProfile.save`, `UserRepository`, `InMemoryUserRepository`.
- Produces:
  - `class SaveMyProfileCommand` (`Schema.Class`: `...ProfileFieldsSchema.fields`,
    `userId: UserID`, `email: Email`), `SaveMyProfileHandler.execute(command):
Effect<MusicianProfile, UserError, UserRepository>`.
  - `class GetMyProfileQuery` (`{ userId }`), `GetMyProfileHandler.execute(query):
Effect<Option<MusicianProfile>, UserError, UserRepository>`.

- [ ] **Step 1: Write the failing tests**

`packages/context-user/test/application/commands/SaveMyProfileHandler.test.ts`:

```ts
import { Effect, Either, Layer, Option, Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { SaveMyProfileCommand, SaveMyProfileHandler } from '#context-user/application/commands';
import { type MusicianProfile, UserRepository } from '#context-user/domain';
import { InMemoryUserRepository } from '#context-user/infrastructure/memory';

const INPUT = {
  userId: 'user_ana',
  email: 'Ana@Example.com',
  name: 'Ana Lopez',
  phone: '+33612345678',
  preferredChannel: 'WHATSAPP',
  roles: [{ role: 'bass', isPrimary: true }],
  styles: [],
};

const command = (overrides: Record<string, unknown> = {}) =>
  Schema.decodeUnknownSync(SaveMyProfileCommand)({ ...INPUT, ...overrides });

/** A request that read the profile before another one wrote it. */
class StaleRepository extends InMemoryUserRepository {
  override findProfile() {
    return Effect.succeed(Option.none<MusicianProfile>());
  }
}

function run(repository: UserRepository, saveCommand: SaveMyProfileCommand) {
  return Effect.runPromise(
    Effect.either(
      SaveMyProfileHandler.execute(saveCommand).pipe(
        Effect.provide(Layer.succeed(UserRepository, repository)),
      ),
    ),
  );
}

describe('SaveMyProfileHandler', () => {
  it('creates the profile, then updates it', async () => {
    const repository = new InMemoryUserRepository();

    const created = Either.getOrThrow(await run(repository, command()));
    const updated = Either.getOrThrow(await run(repository, command({ name: 'Ana L.' })));

    expect(created.version).toBe(1);
    expect(created.email).toBe('ana@example.com');
    expect(updated.version).toBe(2);
    expect(Effect.runSync(repository.findProfile(updated.userId))).toEqual(Option.some(updated));
  });

  it('stores nothing when a rule is broken', async () => {
    const repository = new InMemoryUserRepository();

    const { phone: _phone, ...withoutPhone } = INPUT;
    const noPhone = Schema.decodeUnknownSync(SaveMyProfileCommand)({
      ...withoutPhone,
      preferredChannel: 'SMS',
    });

    const result = await run(repository, noPhone);

    expect(result).toEqual(
      Either.left(expect.objectContaining({ rule: 'PHONE_REQUIRED_FOR_CHANNEL' })),
    );
    expect(Effect.runSync(repository.findProfile(noPhone.userId))).toEqual(Option.none());
  });

  it('surfaces a conflict when the profile changed between read and write', async () => {
    const stale = new StaleRepository();
    Either.getOrThrow(await run(stale, command()));

    const result = await run(stale, command({ name: 'Other tab' }));

    expect(result).toEqual(
      Either.left(expect.objectContaining({ _tag: 'ConcurrentModification' })),
    );
  });
});
```

`packages/context-user/test/application/queries/GetMyProfileHandler.test.ts`:

```ts
import { Effect, Layer, Option, Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { GetMyProfileHandler, GetMyProfileQuery } from '#context-user/application/queries';
import { UserRepository } from '#context-user/domain';
import { InMemoryUserRepository } from '#context-user/infrastructure/memory';

describe('GetMyProfileHandler', () => {
  it('returns none before the first save', async () => {
    const query = Schema.decodeUnknownSync(GetMyProfileQuery)({ userId: 'user_ana' });

    const result = await Effect.runPromise(
      GetMyProfileHandler.execute(query).pipe(
        Effect.provide(Layer.succeed(UserRepository, new InMemoryUserRepository())),
      ),
    );

    expect(result).toEqual(Option.none());
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run --project context-user test/application`
Expected: FAIL — `#context-user/application/commands` cannot be resolved.

- [ ] **Step 3: Implement**

`packages/context-user/src/application/commands/SaveMyProfile/SaveMyProfileCommand.ts`:

```ts
import { Schema } from 'effect';

import { Email, UserID } from '@chordcraft/shared/valueObjects';

import { ProfileFieldsSchema } from '#context-user/domain';

/** `userId` and `email` come from the authorizer, never from the client. */
export class SaveMyProfileCommand extends Schema.Class<SaveMyProfileCommand>(
  'SaveMyProfileCommand',
)({
  ...ProfileFieldsSchema.fields,
  userId: UserID.schema,
  email: Email.schema,
}) {}
```

`packages/context-user/src/application/commands/SaveMyProfile/SaveMyProfileHandler.ts`:

```ts
import { Effect } from 'effect';

import { MusicianProfile, type UserError, UserRepository } from '#context-user/domain';

import type { SaveMyProfileCommand } from './SaveMyProfileCommand';

export class SaveMyProfileHandler {
  static execute(
    command: SaveMyProfileCommand,
  ): Effect.Effect<MusicianProfile, UserError, UserRepository> {
    return Effect.gen(function* () {
      const repository = yield* UserRepository;
      const existing = yield* repository.findProfile(command.userId);
      const { email, userId, ...fields } = command;

      const profile = yield* MusicianProfile.save({
        existing,
        userId,
        email,
        fields,
        now: new Date(),
      });
      yield* repository.saveProfile(profile);
      return profile;
    });
  }
}
```

`packages/context-user/src/application/commands/SaveMyProfile/index.ts`:

```ts
export * from './SaveMyProfileCommand';
export * from './SaveMyProfileHandler';
```

`packages/context-user/src/application/queries/GetMyProfile/GetMyProfileQuery.ts`:

```ts
import { Schema } from 'effect';

import { UserID } from '@chordcraft/shared/valueObjects';

export class GetMyProfileQuery extends Schema.Class<GetMyProfileQuery>('GetMyProfileQuery')({
  userId: UserID.schema,
}) {}
```

`packages/context-user/src/application/queries/GetMyProfile/GetMyProfileHandler.ts`:

```ts
import { Effect, type Option } from 'effect';

import { type MusicianProfile, type UserError, UserRepository } from '#context-user/domain';

import type { GetMyProfileQuery } from './GetMyProfileQuery';

export class GetMyProfileHandler {
  static execute(
    query: GetMyProfileQuery,
  ): Effect.Effect<Option.Option<MusicianProfile>, UserError, UserRepository> {
    return Effect.flatMap(UserRepository, (repository) => repository.findProfile(query.userId));
  }
}
```

`packages/context-user/src/application/queries/GetMyProfile/index.ts`:

```ts
export * from './GetMyProfileHandler';
export * from './GetMyProfileQuery';
```

`packages/context-user/src/application/commands/index.ts`: `export * from './SaveMyProfile';`

`packages/context-user/src/application/queries/index.ts`: `export * from './GetMyProfile';`

`packages/context-user/src/application/index.ts`:

```ts
export * as commands from './commands';
export * as queries from './queries';
```

Add to `packages/context-user/src/index.ts`: `export * as UserApplication from './application';`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run --project context-user`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/context-user
git commit -m "feat(context-user): save and read my musician profile"
```

---

### Task 10: Manage my unavailability (application)

**Files:**

- Create: `packages/context-user/src/application/commands/{AddUnavailability,UpdateUnavailability,RemoveUnavailability}/{index,<Name>Command,<Name>Handler}.ts`
- Create: `packages/context-user/src/application/queries/ListMyUnavailability/{index,ListMyUnavailabilityQuery,ListMyUnavailabilityHandler}.ts`
- Modify: `packages/context-user/src/application/commands/index.ts`, `queries/index.ts`
- Test: `packages/context-user/test/application/commands/UnavailabilityHandlers.test.ts`

**Interfaces:**

- Produces:
  - `AddUnavailabilityCommand` (`{ userId, ...UnavailabilityFieldsSchema.fields }`) →
    `AddUnavailabilityHandler.execute: Effect<Unavailability, UserError, UserRepository>`.
  - `UpdateUnavailabilityCommand` (`{ userId, id, ...fields }`) → `Effect<Unavailability, …>`;
    `UnavailabilityNotFound` when the id is not the caller's.
  - `RemoveUnavailabilityCommand` (`{ userId, id }`) → `Effect<true, …>`; same not-found rule.
  - `ListMyUnavailabilityQuery` (`{ userId, range: DateRange }`) →
    `Effect<ReadonlyArray<Unavailability>, …>`.

- [ ] **Step 1: Write the failing test**

`packages/context-user/test/application/commands/UnavailabilityHandlers.test.ts`:

```ts
import { Effect, Either, Layer, Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import {
  AddUnavailabilityCommand,
  AddUnavailabilityHandler,
  RemoveUnavailabilityCommand,
  RemoveUnavailabilityHandler,
  UpdateUnavailabilityCommand,
  UpdateUnavailabilityHandler,
} from '#context-user/application/commands';
import {
  ListMyUnavailabilityHandler,
  ListMyUnavailabilityQuery,
} from '#context-user/application/queries';
import { UserRepository } from '#context-user/domain';
import { InMemoryUserRepository } from '#context-user/infrastructure/memory';

const AUGUST = { from: '2026-08-01', to: '2026-08-31' };

function setup() {
  const layer = Layer.succeed(UserRepository, new InMemoryUserRepository());
  const run = <A, E>(effect: Effect.Effect<A, E, UserRepository>) =>
    Effect.runPromise(Effect.either(effect.pipe(Effect.provide(layer))));
  const add = (userId: string, range: { from: string; to: string }) =>
    run(
      AddUnavailabilityHandler.execute(
        Schema.decodeUnknownSync(AddUnavailabilityCommand)({ userId, range, scope: 'ALL' }),
      ),
    ).then(Either.getOrThrow);
  const list = (userId: string) =>
    run(
      ListMyUnavailabilityHandler.execute(
        Schema.decodeUnknownSync(ListMyUnavailabilityQuery)({ userId, range: AUGUST }),
      ),
    ).then(Either.getOrThrow);
  return { add, list, run };
}

describe('unavailability handlers', () => {
  it('adds, moves and removes an entry', async () => {
    const { add, list, run } = setup();
    const entry = await add('user_ana', { from: '2026-08-10', to: '2026-08-12' });

    const moved = Either.getOrThrow(
      await run(
        UpdateUnavailabilityHandler.execute(
          Schema.decodeUnknownSync(UpdateUnavailabilityCommand)({
            userId: 'user_ana',
            id: entry.id,
            range: { from: '2026-08-20', to: '2026-08-21' },
            reason: 'wedding',
            scope: 'ALL',
          }),
        ),
      ),
    );
    expect(moved.id).toBe(entry.id);
    expect((await list('user_ana')).map((item) => item.range)).toEqual([
      { from: '2026-08-20', to: '2026-08-21' },
    ]);

    await run(
      RemoveUnavailabilityHandler.execute(
        Schema.decodeUnknownSync(RemoveUnavailabilityCommand)({ userId: 'user_ana', id: entry.id }),
      ),
    );
    expect(await list('user_ana')).toEqual([]);
  });

  it("cannot update or remove another user's entry", async () => {
    const { add, list, run } = setup();
    const anasEntry = await add('user_ana', { from: '2026-08-10', to: '2026-08-12' });

    const update = await run(
      UpdateUnavailabilityHandler.execute(
        Schema.decodeUnknownSync(UpdateUnavailabilityCommand)({
          userId: 'user_bob',
          id: anasEntry.id,
          range: { from: '2026-08-01', to: '2026-08-02' },
          scope: 'ALL',
        }),
      ),
    );
    const remove = await run(
      RemoveUnavailabilityHandler.execute(
        Schema.decodeUnknownSync(RemoveUnavailabilityCommand)({
          userId: 'user_bob',
          id: anasEntry.id,
        }),
      ),
    );

    expect(update).toEqual(
      Either.left(expect.objectContaining({ _tag: 'UnavailabilityNotFound' })),
    );
    expect(remove).toEqual(
      Either.left(expect.objectContaining({ _tag: 'UnavailabilityNotFound' })),
    );
    expect(await list('user_ana')).toHaveLength(1);
    expect(await list('user_bob')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run --project context-user test/application/commands/UnavailabilityHandlers.test.ts`
Expected: FAIL — the commands are not exported.

- [ ] **Step 3: Implement the commands and query**

`AddUnavailability/AddUnavailabilityCommand.ts`:

```ts
import { Schema } from 'effect';

import { UserID } from '@chordcraft/shared/valueObjects';

import { UnavailabilityFieldsSchema } from '#context-user/domain';

export class AddUnavailabilityCommand extends Schema.Class<AddUnavailabilityCommand>(
  'AddUnavailabilityCommand',
)({
  ...UnavailabilityFieldsSchema.fields,
  userId: UserID.schema,
}) {}
```

`AddUnavailability/AddUnavailabilityHandler.ts`:

```ts
import { Effect } from 'effect';

import {
  Unavailability,
  UnavailabilityID,
  type UserError,
  UserRepository,
} from '#context-user/domain';

import type { AddUnavailabilityCommand } from './AddUnavailabilityCommand';

export class AddUnavailabilityHandler {
  static execute(
    command: AddUnavailabilityCommand,
  ): Effect.Effect<Unavailability, UserError, UserRepository> {
    return Effect.gen(function* () {
      const repository = yield* UserRepository;
      const { userId, ...fields } = command;
      const entry = Unavailability.create({ id: UnavailabilityID.generate(), userId, fields });
      yield* repository.saveUnavailability(entry);
      return entry;
    });
  }
}
```

`UpdateUnavailability/UpdateUnavailabilityCommand.ts`:

```ts
import { Schema } from 'effect';

import { UserID } from '@chordcraft/shared/valueObjects';

import { UnavailabilityFieldsSchema, UnavailabilityID } from '#context-user/domain';

export class UpdateUnavailabilityCommand extends Schema.Class<UpdateUnavailabilityCommand>(
  'UpdateUnavailabilityCommand',
)({
  ...UnavailabilityFieldsSchema.fields,
  userId: UserID.schema,
  id: UnavailabilityID.schema,
}) {}
```

`UpdateUnavailability/UpdateUnavailabilityHandler.ts`:

```ts
import { Effect, Option } from 'effect';

import {
  Unavailability,
  UnavailabilityNotFound,
  type UserError,
  UserRepository,
} from '#context-user/domain';

import type { UpdateUnavailabilityCommand } from './UpdateUnavailabilityCommand';

export class UpdateUnavailabilityHandler {
  static execute(
    command: UpdateUnavailabilityCommand,
  ): Effect.Effect<Unavailability, UserError, UserRepository> {
    return Effect.gen(function* () {
      const repository = yield* UserRepository;
      const { id, userId, ...fields } = command;
      // Looked up under the caller's id, so another user's entry reads as not found.
      const existing = yield* repository.findUnavailability(userId, id);
      if (Option.isNone(existing)) return yield* new UnavailabilityNotFound({ id });

      const entry = Unavailability.create({ id, userId, fields });
      yield* repository.saveUnavailability(entry);
      return entry;
    });
  }
}
```

`RemoveUnavailability/RemoveUnavailabilityCommand.ts`:

```ts
import { Schema } from 'effect';

import { UserID } from '@chordcraft/shared/valueObjects';

import { UnavailabilityID } from '#context-user/domain';

export class RemoveUnavailabilityCommand extends Schema.Class<RemoveUnavailabilityCommand>(
  'RemoveUnavailabilityCommand',
)({
  userId: UserID.schema,
  id: UnavailabilityID.schema,
}) {}
```

`RemoveUnavailability/RemoveUnavailabilityHandler.ts`:

```ts
import { Effect, Option } from 'effect';

import { UnavailabilityNotFound, type UserError, UserRepository } from '#context-user/domain';

import type { RemoveUnavailabilityCommand } from './RemoveUnavailabilityCommand';

export class RemoveUnavailabilityHandler {
  static execute(
    command: RemoveUnavailabilityCommand,
  ): Effect.Effect<true, UserError, UserRepository> {
    return Effect.gen(function* () {
      const repository = yield* UserRepository;
      const existing = yield* repository.findUnavailability(command.userId, command.id);
      if (Option.isNone(existing)) return yield* new UnavailabilityNotFound({ id: command.id });

      yield* repository.deleteUnavailability(existing.value);
      return true as const;
    });
  }
}
```

`queries/ListMyUnavailability/ListMyUnavailabilityQuery.ts`:

```ts
import { Schema } from 'effect';

import { DateRange, UserID } from '@chordcraft/shared/valueObjects';

export class ListMyUnavailabilityQuery extends Schema.Class<ListMyUnavailabilityQuery>(
  'ListMyUnavailabilityQuery',
)({
  userId: UserID.schema,
  range: DateRange.schema,
}) {}
```

`queries/ListMyUnavailability/ListMyUnavailabilityHandler.ts`:

```ts
import { Effect } from 'effect';

import { type Unavailability, type UserError, UserRepository } from '#context-user/domain';

import type { ListMyUnavailabilityQuery } from './ListMyUnavailabilityQuery';

export class ListMyUnavailabilityHandler {
  static execute(
    query: ListMyUnavailabilityQuery,
  ): Effect.Effect<ReadonlyArray<Unavailability>, UserError, UserRepository> {
    return Effect.flatMap(UserRepository, (repository) =>
      repository.listUnavailability(query.userId, query.range),
    );
  }
}
```

Each folder gets an `index.ts` re-exporting its two files (as in Task 9). Then:

`packages/context-user/src/application/commands/index.ts`:

```ts
export * from './AddUnavailability';
export * from './RemoveUnavailability';
export * from './SaveMyProfile';
export * from './UpdateUnavailability';
```

`packages/context-user/src/application/queries/index.ts`:

```ts
export * from './GetMyProfile';
export * from './ListMyUnavailability';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run --project context-user`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/context-user
git commit -m "feat(context-user): add, move, remove and list my unavailability"
```

---

### Task 11: DynamoDB adapter and the integration projects

**Files:**

- Create: `packages/context-user/src/infrastructure/dynamodb/{index,DynamoDBUserRepository,services}.ts`
- Modify: `packages/context-user/src/infrastructure/index.ts`
- Create: `packages/context-user/test/infrastructure/dynamodb/{helpers,DynamoDBUserRepository.test}.ts`
- Modify (root): `vitest.config.ts`, `package.json` (test scripts), `CLAUDE.md` (Testing section)

**Interfaces:**

- Consumes: the `UserRepository` contract (Task 8).
- Produces: `DynamoDBUserRepository` (table from `process.env.USERS_TABLE ?? 'users'`),
  `UserRepositoryLive`, `UserServicesLive: Layer<UserRepository>`. Table layout: profile
  `PK = USER#<userId>`, `SK = PROFILE`; unavailability `PK = USER#<userId>`,
  `SK = UNAVAIL#<id>`, `LSI1SK = UNAVAIL#<from>#<id>` on local index `LSI1`.

- [ ] **Step 1: Split the integration project per context**

In root `vitest.config.ts`, replace `integrationProject` with a factory and list both:

```ts
// Integration tests (test/infrastructure/**) need a local DynamoDB. Each context gets its own
// project, all named `integration-*`, so `test:integration` selects them with one pattern and
// the default run excludes them with `--project '!integration-*'`.
const integrationProject = (context: string) => ({
  plugins: [tsconfigPaths()],
  resolve: { alias: workspaceAliases },
  test: {
    name: `integration-${context}`,
    root: `packages/context-${context}`,
    include: ['test/infrastructure/**/*.test.ts'],
  },
});
```

and in `projects`: replace `integrationProject,` with
`integrationProject('chart'), integrationProject('user'),`.

In root `package.json`, update:

```json
"coverage": "vitest run --coverage --project '!integration-*'",
"test": "vitest --project '!integration-*'",
"test:integration": "vitest run --project 'integration-*'",
"test:run": "vitest run --project '!integration-*'",
```

Run: `pnpm test:run 2>&1 | tail -5`
Expected: the usual unit suites pass and no `test/infrastructure` file runs. If Vitest rejects a
negated wildcard, use two flags instead (`--project '!integration-chart' --project
'!integration-user'`) in `coverage`, `test` and `test:run`.

- [ ] **Step 2: Write the failing integration tests**

`packages/context-user/test/infrastructure/dynamodb/helpers.ts`:

```ts
import { CreateTableCommand, DeleteTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const USERS_TABLE = 'users';

export function createTestClient(): DynamoDBClient {
  return new DynamoDBClient({
    region: 'local',
    endpoint: process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000',
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });
}

/** Mirrors the CDK table: PK/SK plus the LSI1 date index. */
export async function createUsersTable(client: DynamoDBClient): Promise<void> {
  await client.send(
    new CreateTableCommand({
      TableName: USERS_TABLE,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'LSI1SK', AttributeType: 'S' },
      ],
      LocalSecondaryIndexes: [
        {
          IndexName: 'LSI1',
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'LSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }),
  );
}

export async function deleteTable(client: DynamoDBClient, tableName: string): Promise<void> {
  await client.send(new DeleteTableCommand({ TableName: tableName }));
}
```

`packages/context-user/test/infrastructure/dynamodb/DynamoDBUserRepository.test.ts`:

```ts
import { Effect, Either, Option, Schema } from 'effect';

import { DateRange, Email, UserID } from '@chordcraft/shared/valueObjects';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { MusicianProfile } from '#context-user/domain/MusicianProfile';
import { Unavailability } from '#context-user/domain/Unavailability';
import {
  ProfileFieldsSchema,
  UnavailabilityFieldsSchema,
  UnavailabilityID,
} from '#context-user/domain/valueObjects';
import { DynamoDBUserRepository } from '#context-user/infrastructure/dynamodb/DynamoDBUserRepository';

import { createTestClient, createUsersTable, deleteTable, USERS_TABLE } from './helpers';

const range = (from: string, to: string) =>
  Schema.decodeUnknownSync(DateRange.schema)({ from, to });

function profile(userId: string, version: number) {
  return new MusicianProfile({
    ...Schema.decodeUnknownSync(ProfileFieldsSchema)({
      name: 'Ana',
      phone: '+33612345678',
      preferredChannel: 'WHATSAPP',
      region: { country: 'FR' },
      roles: [{ role: 'bass', isPrimary: true, level: 'ADVANCED' }],
      styles: [{ style: 'other', detail: 'zouk' }],
    }),
    userId: UserID.schema.make(userId),
    email: Schema.decodeUnknownSync(Email.schema)('ana@example.com'),
    version,
    createdAt: new Date('2026-09-30T10:00:00.000Z'),
    updatedAt: new Date('2026-09-30T10:00:00.000Z'),
  });
}

function unavailability(
  userId: string,
  from: string,
  to: string,
  id = UnavailabilityID.generate(),
) {
  return Unavailability.create({
    id,
    userId: UserID.schema.make(userId),
    fields: Schema.decodeUnknownSync(UnavailabilityFieldsSchema)({
      range: { from, to },
      scope: 'ALL',
    }),
  });
}

describe('DynamoDBUserRepository', () => {
  const client = createTestClient();
  const repository = new DynamoDBUserRepository(client);
  const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(Effect.either(effect));

  beforeAll(async () => {
    await createUsersTable(client);
  });

  afterAll(async () => {
    await deleteTable(client, USERS_TABLE);
  });

  it('saves a profile and reads it back', async () => {
    const saved = profile('user_roundtrip', 1);
    await Effect.runPromise(repository.saveProfile(saved));

    expect(await Effect.runPromise(repository.findProfile(saved.userId))).toEqual(
      Option.some(saved),
    );
  });

  it('refuses a second version 1 and a stale version', async () => {
    await Effect.runPromise(repository.saveProfile(profile('user_conflict', 1)));
    const again = await run(repository.saveProfile(profile('user_conflict', 1)));
    await Effect.runPromise(repository.saveProfile(profile('user_conflict', 2)));
    const stale = await run(repository.saveProfile(profile('user_conflict', 2)));

    for (const result of [again, stale]) {
      expect(result).toEqual(
        Either.left(expect.objectContaining({ _tag: 'ConcurrentModification' })),
      );
    }
  });

  it('lists an absence that started 365 days before the window', async () => {
    const long = unavailability('user_edge', '2025-08-01', '2026-08-01'); // 366 days
    await Effect.runPromise(repository.saveUnavailability(long));

    const listed = await Effect.runPromise(
      repository.listUnavailability(long.userId, range('2026-08-01', '2026-08-31')),
    );

    expect(listed.map((item) => item.id)).toEqual([long.id]);
  });

  it('leaves out an entry that ended the day before the window', async () => {
    const before = unavailability('user_before', '2026-07-25', '2026-07-31');
    await Effect.runPromise(repository.saveUnavailability(before));

    const listed = await Effect.runPromise(
      repository.listUnavailability(before.userId, range('2026-08-01', '2026-08-31')),
    );

    expect(listed).toEqual([]);
  });

  it('re-indexes an entry whose dates moved', async () => {
    const id = UnavailabilityID.generate();
    await Effect.runPromise(
      repository.saveUnavailability(unavailability('user_move', '2026-08-10', '2026-08-12', id)),
    );
    await Effect.runPromise(
      repository.saveUnavailability(unavailability('user_move', '2026-10-01', '2026-10-02', id)),
    );
    const userId = UserID.schema.make('user_move');

    expect(
      await Effect.runPromise(
        repository.listUnavailability(userId, range('2026-08-01', '2026-08-31')),
      ),
    ).toEqual([]);
    expect(
      (
        await Effect.runPromise(
          repository.listUnavailability(userId, range('2026-10-01', '2026-10-31')),
        )
      ).map((item) => item.id),
    ).toEqual([id]);
  });

  it("deletes an entry, and never lists another user's entries", async () => {
    const ana = unavailability('user_ana', '2026-08-10', '2026-08-12');
    const bob = unavailability('user_bob', '2026-08-10', '2026-08-12');
    await Effect.runPromise(repository.saveUnavailability(ana));
    await Effect.runPromise(repository.saveUnavailability(bob));

    await Effect.runPromise(repository.deleteUnavailability(ana));

    expect(await Effect.runPromise(repository.findUnavailability(ana.userId, ana.id))).toEqual(
      Option.none(),
    );
    expect(
      (
        await Effect.runPromise(
          repository.listUnavailability(bob.userId, range('2026-08-01', '2026-08-31')),
        )
      ).map((item) => item.id),
    ).toEqual([bob.id]);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `docker compose up -d && pnpm test:integration`
Expected: `integration-chart` PASSES (9 tests); `integration-user` FAILS —
`DynamoDBUserRepository` cannot be resolved.

- [ ] **Step 4: Implement the adapter**

`packages/context-user/src/infrastructure/dynamodb/DynamoDBUserRepository.ts`:

```ts
import { Effect, Option, Schema } from 'effect';

import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocument,
  GetCommand,
  PutCommand,
  QueryCommand,
  type QueryCommandInput,
  type QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { DateRange, LocalDate, type UserID } from '@chordcraft/shared/valueObjects';

import {
  ConcurrentModification,
  MusicianProfile,
  Unavailability,
  type UnavailabilityID,
  type UserError,
  UserParseError,
  UserReadError,
  type UserRepository,
  UserWriteError,
} from '#context-user/domain';

/** Set by the CDK stack, which prefixes the table with the stack name. */
const TABLE_NAME = process.env.USERS_TABLE ?? 'users';
const BY_DATE_INDEX = 'LSI1';
const PROFILE_KEY = 'PROFILE';

const userKey = (userId: string) => `USER#${userId}`;
const unavailabilityKey = (id: string) => `UNAVAIL#${id}`;
const unavailabilityDateKey = (from: string, id: string) => `UNAVAIL#${from}#${id}`;

const checkIsConditionalFailure = (error: unknown) =>
  error instanceof Error && error.name === 'ConditionalCheckFailedException';

const decodeProfile = (item: unknown) =>
  Schema.decodeUnknown(MusicianProfile)(item).pipe(
    Effect.mapError((reason) => new UserParseError({ reason })),
  );

const decodeUnavailability = (item: unknown) =>
  Schema.decodeUnknown(Unavailability)(item).pipe(
    Effect.mapError((reason) => new UserParseError({ reason })),
  );

/**
 * `{stack}-users`. Profiles are guarded by `version` (optimistic concurrency). Unavailability is
 * keyed by id, and `LSI1` indexes it by start date for range reads.
 */
export class DynamoDBUserRepository implements UserRepository {
  private readonly client: DynamoDBDocument;
  private readonly tableName = TABLE_NAME;

  constructor(client: DynamoDBClient) {
    this.client = DynamoDBDocument.from(client);
  }

  findProfile(userId: UserID.UserID): Effect.Effect<Option.Option<MusicianProfile>, UserError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new GetCommand({
            TableName: this.tableName,
            Key: { PK: userKey(userId), SK: PROFILE_KEY },
            ConsistentRead: true,
          }),
        ),
      catch: (error) => new UserReadError({ reason: error }),
    }).pipe(
      Effect.flatMap(({ Item }) =>
        Item === undefined
          ? Effect.succeed(Option.none())
          : decodeProfile(Item).pipe(Effect.map(Option.some)),
      ),
    );
  }

  saveProfile(profile: MusicianProfile): Effect.Effect<void, UserError> {
    const isFirstVersion = profile.version === 1;
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new PutCommand({
            TableName: this.tableName,
            Item: {
              PK: userKey(profile.userId),
              SK: PROFILE_KEY,
              ...Schema.encodeSync(MusicianProfile)(profile),
            },
            ConditionExpression: isFirstVersion
              ? 'attribute_not_exists(PK)'
              : 'version = :expected',
            ...(isFirstVersion
              ? {}
              : { ExpressionAttributeValues: { ':expected': profile.version - 1 } }),
          }),
        ),
      catch: (error) =>
        checkIsConditionalFailure(error)
          ? new ConcurrentModification({ entity: 'MusicianProfile' })
          : new UserWriteError({ reason: error }),
    });
  }

  findUnavailability(
    userId: UserID.UserID,
    id: UnavailabilityID.UnavailabilityID,
  ): Effect.Effect<Option.Option<Unavailability>, UserError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new GetCommand({
            TableName: this.tableName,
            Key: { PK: userKey(userId), SK: unavailabilityKey(id) },
            ConsistentRead: true,
          }),
        ),
      catch: (error) => new UserReadError({ reason: error }),
    }).pipe(
      Effect.flatMap(({ Item }) =>
        Item === undefined
          ? Effect.succeed(Option.none())
          : decodeUnavailability(Item).pipe(Effect.map(Option.some)),
      ),
    );
  }

  /**
   * An entry overlapping `range` starts at most MAX_SPAN_DAYS - 1 days before `range.from`, so one
   * bounded LSI1 query finds every candidate; the ones that ended earlier are dropped here.
   */
  listUnavailability(
    userId: UserID.UserID,
    range: DateRange.DateRange,
  ): Effect.Effect<ReadonlyArray<Unavailability>, UserError> {
    const earliestStart = LocalDate.addDays(range.from, -(DateRange.MAX_SPAN_DAYS - 1));
    return this.queryAll({
      TableName: this.tableName,
      IndexName: BY_DATE_INDEX,
      KeyConditionExpression: 'PK = :pk AND LSI1SK BETWEEN :low AND :high',
      ExpressionAttributeValues: {
        ':pk': userKey(userId),
        ':low': `UNAVAIL#${earliestStart}`,
        ':high': `UNAVAIL#${range.to}#~`,
      },
      ConsistentRead: true,
    }).pipe(
      Effect.flatMap((items) => Effect.all(items.map((item) => decodeUnavailability(item)))),
      Effect.map((entries) =>
        entries.filter((entry) => DateRange.checkOverlaps(entry.range, range)),
      ),
    );
  }

  saveUnavailability(entry: Unavailability): Effect.Effect<void, UserError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new PutCommand({
            TableName: this.tableName,
            Item: {
              PK: userKey(entry.userId),
              SK: unavailabilityKey(entry.id),
              LSI1SK: unavailabilityDateKey(entry.range.from, entry.id),
              ...Schema.encodeSync(Unavailability)(entry),
            },
          }),
        ),
      catch: (error) => new UserWriteError({ reason: error }),
    });
  }

  deleteUnavailability(entry: Unavailability): Effect.Effect<void, UserError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new DeleteCommand({
            TableName: this.tableName,
            Key: { PK: userKey(entry.userId), SK: unavailabilityKey(entry.id) },
          }),
        ),
      catch: (error) => new UserWriteError({ reason: error }),
    });
  }

  /** Follows `LastEvaluatedKey`: a query returns at most 1MB per call. */
  private queryAll(
    input: QueryCommandInput,
  ): Effect.Effect<ReadonlyArray<Record<string, unknown>>, UserError> {
    return Effect.tryPromise({
      try: async () => {
        const items: Array<Record<string, unknown>> = [];
        let startKey: QueryCommandOutput['LastEvaluatedKey'];
        do {
          const page: QueryCommandOutput = await this.client.send(
            new QueryCommand({ ...input, ExclusiveStartKey: startKey }),
          );
          for (const item of page.Items ?? []) items.push(item);
          startKey = page.LastEvaluatedKey;
        } while (startKey);
        return items;
      },
      catch: (error) => new UserReadError({ reason: error }),
    });
  }
}
```

`packages/context-user/src/infrastructure/dynamodb/services.ts`:

```ts
import { Context, Effect, Layer } from 'effect';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { UserRepository } from '#context-user/domain/UserRepository';

import { DynamoDBUserRepository } from './DynamoDBUserRepository';

const DynamoDBClientTag = Context.GenericTag<DynamoDBClient>('DynamoDBClient');

export const DynamoDBClientLive = Layer.succeed(
  DynamoDBClientTag,
  new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-3' }),
);

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const client = yield* DynamoDBClientTag;
    return new DynamoDBUserRepository(client);
  }),
).pipe(Layer.provide(DynamoDBClientLive));

export const UserServicesLive = UserRepositoryLive;
```

`packages/context-user/src/infrastructure/dynamodb/index.ts`:

```ts
export * from './DynamoDBUserRepository';
export * from './services';
```

`packages/context-user/src/infrastructure/index.ts`:

```ts
export * as dynamodb from './dynamodb';
export * as memory from './memory';
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test:integration`
Expected: `integration-chart` 9 passed, `integration-user` 6 passed.

- [ ] **Step 6: Update the testing notes**

In `CLAUDE.md` § Testing → Vitest Configuration, replace the integration bullet with:

```md
- Integration tests (`test/infrastructure/**`) need a local DynamoDB (`docker compose up`)
  and run via `pnpm test:integration`. Each context has its own vitest project named
  `integration-<context>` (`integration-chart`, `integration-user`); the default run excludes
  them with `--project '!integration-*'`
```

- [ ] **Step 7: Commit**

```bash
git add packages/context-user vitest.config.ts package.json CLAUDE.md
git commit -m "feat(context-user): store profiles and unavailability in DynamoDB"
```

---

### Task 12: GraphQL schema, error mapping and resolvers

**Files:**

- Create: `packages/context-user/src/interface/graphql/schema.graphql`
- Create: `packages/context-user/src/interface/graphql/{args,errors,unavailabilityMapping}.ts`
- Create: `packages/context-user/src/interface/graphql/resolvers/{index,myProfile,saveMyProfile,myUnavailability,addUnavailability,updateUnavailability,removeUnavailability}.ts`
- Create: `packages/context-user/src/interface/{index,graphql/index}.ts`
- Modify: `packages/context-user/src/index.ts`
- Test: `packages/context-user/test/interface/graphql/errors.test.ts`,
  `test/interface/graphql/resolvers.test.ts`

**Interfaces:**

- Consumes: Tasks 9–11.
- Produces:
  - Every resolver: `(input: unknown, layer: Layer<UserRepository> = UserServicesLive) =>
Promise<…>`. `input` is the AppSync `arguments` plus `userId` and `email` injected by
    `api-user` (Task 13): `myProfile({ userId })`, `saveMyProfile({ input, userId, email })`,
    `myUnavailability({ from, to, userId })`, `addUnavailability({ input, userId })`,
    `updateUnavailability({ id, input, userId })`, `removeUnavailability({ id, userId })`.
  - `UnavailabilityView` (`{ id, from, to, reason: string | null, appliesToAllBands, bandIds }`).
  - `GraphQLDomainError` (`errorType: ErrorType`, `name === errorType`), `toGraphQLError`,
    `runResolver`.

- [ ] **Step 1: Write the schema**

`packages/context-user/src/interface/graphql/schema.graphql`:

```graphql
enum ContactChannel {
  WHATSAPP
  SMS
  EMAIL
  PHONE_CALL
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  PROFESSIONAL
  MASTER
}

type Region {
  country: String!
  area: String
}

type RoleTag {
  role: String!
  detail: String
  isPrimary: Boolean!
  level: SkillLevel
}

type StyleTag {
  style: String!
  detail: String
}

type MusicianProfile {
  userId: ID!
  name: String!
  email: String!
  phone: String
  preferredChannel: ContactChannel!
  region: Region
  roles: [RoleTag!]!
  styles: [StyleTag!]!
  version: Int!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Unavailability {
  id: ID!
  from: AWSDate!
  to: AWSDate!
  reason: String
  appliesToAllBands: Boolean!
  bandIds: [ID!]!
}

input RegionInput {
  country: String!
  area: String
}

input RoleTagInput {
  role: String!
  detail: String
  isPrimary: Boolean!
  level: SkillLevel
}

input StyleTagInput {
  style: String!
  detail: String
}

input SaveProfileInput {
  name: String!
  phone: String
  preferredChannel: ContactChannel!
  region: RegionInput
  roles: [RoleTagInput!]!
  styles: [StyleTagInput!]!
}

"No bandIds (or an empty list) means the entry applies to every band."
input UnavailabilityInput {
  from: AWSDate!
  to: AWSDate!
  reason: String
  bandIds: [ID!]
}

type Query {
  myProfile: MusicianProfile
  myUnavailability(from: AWSDate!, to: AWSDate!): [Unavailability!]!
}

type Mutation {
  saveMyProfile(input: SaveProfileInput!): MusicianProfile!
  addUnavailability(input: UnavailabilityInput!): Unavailability!
  updateUnavailability(id: ID!, input: UnavailabilityInput!): Unavailability!
  removeUnavailability(id: ID!): Boolean!
}
```

- [ ] **Step 2: Write the failing tests**

`packages/context-user/test/interface/graphql/errors.test.ts`:

```ts
import { Effect, ParseResult, Schema } from 'effect';

import { describe, expect, it, vi } from 'vitest';

import {
  ConcurrentModification,
  ProfileRuleViolation,
  UnavailabilityNotFound,
  UserReadError,
} from '#context-user/domain';
import {
  GraphQLDomainError,
  runResolver,
  toGraphQLError,
} from '#context-user/interface/graphql/errors';

describe('toGraphQLError', () => {
  it.each([
    [new ProfileRuleViolation({ rule: 'DUPLICATE_ROLE' }), 'VALIDATION', 'DUPLICATE_ROLE'],
    [new UnavailabilityNotFound({ id: 'x' }), 'NOT_FOUND', 'Unavailability x not found'],
    [new ConcurrentModification({ entity: 'MusicianProfile' }), 'CONFLICT', 'MusicianProfile'],
    [new UserReadError({ reason: new Error('secret table name') }), 'INTERNAL', 'Internal error'],
  ])('maps %o to %s', (error, errorType, message) => {
    const mapped = toGraphQLError(error);
    expect(mapped.errorType).toBe(errorType);
    expect(mapped.name).toBe(errorType);
    expect(mapped.message).toContain(message);
  });

  it('maps a parse error to VALIDATION with the path that failed', () => {
    const parseError = Effect.runSync(
      Effect.flip(Schema.decodeUnknown(Schema.Struct({ email: Schema.String }))({})),
    );
    expect(parseError).toBeInstanceOf(ParseResult.ParseError);
    const mapped = toGraphQLError(parseError);
    expect(mapped.errorType).toBe('VALIDATION');
    expect(mapped.message).toContain('email');
  });
});

describe('runResolver', () => {
  it('turns a defect into INTERNAL without leaking it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(runResolver('test', Effect.die(new Error('boom')))).rejects.toEqual(
      new GraphQLDomainError('INTERNAL', 'Internal error'),
    );
    error.mockRestore();
  });
});
```

`packages/context-user/test/interface/graphql/resolvers.test.ts`:

```ts
import { Layer } from 'effect';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRepository } from '#context-user/domain';
import { InMemoryUserRepository } from '#context-user/infrastructure/memory';
import { resolvers } from '#context-user/interface/graphql';

const PROFILE_INPUT = {
  name: 'Ana Lopez',
  phone: '+33 6 12 34 56 78',
  preferredChannel: 'WHATSAPP',
  region: { country: 'FR', area: null },
  roles: [{ role: 'bass', detail: null, isPrimary: true, level: 'PROFESSIONAL' }],
  styles: [{ style: 'funk', detail: null }],
};

describe('context-user resolvers', { concurrent: false }, () => {
  let layer: Layer.Layer<UserRepository>;

  beforeEach(() => {
    layer = Layer.succeed(UserRepository, new InMemoryUserRepository());
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('returns null before the first save, then the saved profile', async () => {
    expect(await resolvers.myProfile({ userId: 'user_ana' }, layer)).toBeNull();

    const saved = await resolvers.saveMyProfile(
      { input: PROFILE_INPUT, userId: 'user_ana', email: 'Ana@Example.com' },
      layer,
    );

    expect(saved.version).toBe(1);
    expect(saved.phone).toBe('+33612345678');
    expect(saved.region).toEqual({ country: 'FR' });
    expect(await resolvers.myProfile({ userId: 'user_ana' }, layer)).toEqual(saved);
  });

  it('treats GraphQL nulls as absent fields', async () => {
    const saved = await resolvers.saveMyProfile(
      {
        input: { ...PROFILE_INPUT, phone: null, preferredChannel: 'EMAIL', region: null },
        userId: 'user_ana',
        email: 'ana@example.com',
      },
      layer,
    );

    expect(saved.phone).toBeUndefined();
    expect(saved.region).toBeUndefined();
  });

  it('answers VALIDATION on an empty email claim', async () => {
    await expect(
      resolvers.saveMyProfile({ input: PROFILE_INPUT, userId: 'user_ana', email: '' }, layer),
    ).rejects.toMatchObject({ errorType: 'VALIDATION', message: expect.stringContaining('email') });
  });

  it('answers VALIDATION with the rule code on a cross-field rule', async () => {
    await expect(
      resolvers.saveMyProfile(
        { input: { ...PROFILE_INPUT, phone: null }, userId: 'user_ana', email: 'ana@example.com' },
        layer,
      ),
    ).rejects.toMatchObject({ errorType: 'VALIDATION', message: 'PHONE_REQUIRED_FOR_CHANNEL' });
  });

  it('adds, lists, moves and removes unavailability', async () => {
    const added = await resolvers.addUnavailability(
      {
        input: { from: '2026-08-10', to: '2026-08-12', reason: null, bandIds: [] },
        userId: 'user_ana',
      },
      layer,
    );
    expect(added).toMatchObject({
      from: '2026-08-10',
      appliesToAllBands: true,
      bandIds: [],
      reason: null,
    });

    const moved = await resolvers.updateUnavailability(
      {
        id: added.id,
        input: { from: '2026-08-20', to: '2026-08-21', reason: 'wedding' },
        userId: 'user_ana',
      },
      layer,
    );
    expect(moved).toMatchObject({ id: added.id, from: '2026-08-20', reason: 'wedding' });

    const listed = await resolvers.myUnavailability(
      { from: '2026-08-01', to: '2026-08-31', userId: 'user_ana' },
      layer,
    );
    expect(listed.map((item) => item.id)).toEqual([added.id]);

    expect(await resolvers.removeUnavailability({ id: added.id, userId: 'user_ana' }, layer)).toBe(
      true,
    );
    expect(
      await resolvers.myUnavailability(
        { from: '2026-08-01', to: '2026-08-31', userId: 'user_ana' },
        layer,
      ),
    ).toEqual([]);
  });

  it('answers NOT_FOUND for an unknown unavailability id', async () => {
    await expect(
      resolvers.removeUnavailability(
        { id: '01J9ZZZZZZZZZZZZZZZZZZZZZZ', userId: 'user_ana' },
        layer,
      ),
    ).rejects.toMatchObject({ errorType: 'NOT_FOUND' });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm vitest run --project context-user test/interface`
Expected: FAIL — `#context-user/interface/graphql` cannot be resolved.

- [ ] **Step 4: Implement the helpers**

`packages/context-user/src/interface/graphql/args.ts`:

```ts
/** GraphQL sends `null` for an omitted optional field; the domain schemas model absence. */
export function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => stripNulls(item));
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== null)
      .map(([key, item]) => [key, stripNulls(item)]),
  );
}

export function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...value } : {};
}
```

`packages/context-user/src/interface/graphql/errors.ts`:

```ts
import { Cause, Effect, Exit, Option, ParseResult } from 'effect';

import type { UserError } from '#context-user/domain';

export const ERROR_TYPES = [
  'VALIDATION',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INTERNAL',
] as const;
export type ErrorType = (typeof ERROR_TYPES)[number];

type ResolverError = UserError | ParseResult.ParseError;

/** Thrown to AppSync: the Lambda error's name becomes the GraphQL `errorType`. */
export class GraphQLDomainError extends Error {
  readonly errorType: ErrorType;

  constructor(errorType: ErrorType, message: string) {
    super(message);
    this.name = errorType;
    this.errorType = errorType;
  }
}

export function toGraphQLError(error: ResolverError): GraphQLDomainError {
  if (error instanceof ParseResult.ParseError) {
    return new GraphQLDomainError('VALIDATION', ParseResult.TreeFormatter.formatErrorSync(error));
  }
  switch (error._tag) {
    case 'ProfileRuleViolation':
      return new GraphQLDomainError('VALIDATION', error.rule);
    case 'UnavailabilityNotFound':
      return new GraphQLDomainError('NOT_FOUND', `Unavailability ${error.id} not found`);
    case 'ConcurrentModification':
      return new GraphQLDomainError(
        'CONFLICT',
        `${error.entity} was changed by another request; reload and retry`,
      );
    case 'UserReadError':
    case 'UserWriteError':
    case 'UserParseError':
      return new GraphQLDomainError('INTERNAL', 'Internal error');
  }
}

function logFailure(label: string, error: ResolverError, errorType: ErrorType): void {
  if (errorType === 'INTERNAL') console.error(`${label} failed`, error);
  // Invalid client input is a 400-class mistake, not a server fault.
  else if (errorType === 'VALIDATION' || errorType === 'FORBIDDEN')
    console.warn(`${label} rejected`, error);
}

/** Runs a resolver program and throws what AppSync should show; never leaks a store error. */
export async function runResolver<A>(
  label: string,
  program: Effect.Effect<A, ResolverError>,
): Promise<A> {
  const exit = await Effect.runPromiseExit(program);
  if (Exit.isSuccess(exit)) return exit.value;

  const failure = Cause.failureOption(exit.cause);
  if (Option.isNone(failure)) {
    console.error(`${label} died`, Cause.pretty(exit.cause));
    throw new GraphQLDomainError('INTERNAL', 'Internal error');
  }
  const error = toGraphQLError(failure.value);
  logFailure(label, failure.value, error.errorType);
  throw error;
}
```

`packages/context-user/src/interface/graphql/unavailabilityMapping.ts`:

```ts
import type { Unavailability } from '#context-user/domain';

export interface UnavailabilityView {
  id: string;
  from: string;
  to: string;
  reason: string | null;
  appliesToAllBands: boolean;
  bandIds: ReadonlyArray<string>;
}

/** The flat GraphQL input, in the domain's shape; the command's schema validates the result. */
export function toUnavailabilityFields(input: Record<string, unknown>): Record<string, unknown> {
  const { bandIds, from, reason, to } = input;
  const hasBands = Array.isArray(bandIds) && bandIds.length > 0;
  return {
    range: { from, to },
    ...(reason === undefined ? {} : { reason }),
    scope: hasBands ? { bandIds } : 'ALL',
  };
}

export function toUnavailabilityView(entry: Unavailability): UnavailabilityView {
  return {
    id: entry.id,
    from: entry.range.from,
    to: entry.range.to,
    reason: entry.reason ?? null,
    appliesToAllBands: entry.scope === 'ALL',
    bandIds: entry.scope === 'ALL' ? [] : entry.scope.bandIds,
  };
}
```

- [ ] **Step 5: Implement the resolvers**

`resolvers/myProfile.ts`:

```ts
import { Effect, type Layer, Option, pipe, Schema } from 'effect';

import { GetMyProfileHandler, GetMyProfileQuery } from '#context-user/application/queries';
import type { MusicianProfile, UserRepository } from '#context-user/domain';
import { UserServicesLive } from '#context-user/infrastructure/dynamodb';
import { stripNulls } from '#context-user/interface/graphql/args';
import { runResolver } from '#context-user/interface/graphql/errors';

export function myProfile(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<MusicianProfile | null> {
  const program = pipe(
    Schema.decodeUnknown(GetMyProfileQuery)(stripNulls(input)),
    Effect.flatMap((query) => GetMyProfileHandler.execute(query)),
    Effect.map(Option.getOrNull),
    Effect.provide(layer),
  );
  return runResolver('myProfile', program);
}
```

`resolvers/saveMyProfile.ts`:

```ts
import { Effect, type Layer, pipe, Schema } from 'effect';

import { SaveMyProfileCommand, SaveMyProfileHandler } from '#context-user/application/commands';
import type { MusicianProfile, UserRepository } from '#context-user/domain';
import { UserServicesLive } from '#context-user/infrastructure/dynamodb';
import { stripNulls, toRecord } from '#context-user/interface/graphql/args';
import { runResolver } from '#context-user/interface/graphql/errors';

export function saveMyProfile(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<MusicianProfile> {
  const args = toRecord(stripNulls(input));
  const program = pipe(
    Schema.decodeUnknown(SaveMyProfileCommand)({
      ...toRecord(args.input),
      userId: args.userId,
      email: args.email,
    }),
    Effect.flatMap((command) => SaveMyProfileHandler.execute(command)),
    Effect.provide(layer),
  );
  return runResolver('saveMyProfile', program);
}
```

`resolvers/myUnavailability.ts`:

```ts
import { Effect, type Layer, pipe, Schema } from 'effect';

import {
  ListMyUnavailabilityHandler,
  ListMyUnavailabilityQuery,
} from '#context-user/application/queries';
import type { UserRepository } from '#context-user/domain';
import { UserServicesLive } from '#context-user/infrastructure/dynamodb';
import { stripNulls, toRecord } from '#context-user/interface/graphql/args';
import { runResolver } from '#context-user/interface/graphql/errors';
import {
  toUnavailabilityView,
  type UnavailabilityView,
} from '#context-user/interface/graphql/unavailabilityMapping';

export function myUnavailability(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<ReadonlyArray<UnavailabilityView>> {
  const args = toRecord(stripNulls(input));
  const program = pipe(
    Schema.decodeUnknown(ListMyUnavailabilityQuery)({
      userId: args.userId,
      range: { from: args.from, to: args.to },
    }),
    Effect.flatMap((query) => ListMyUnavailabilityHandler.execute(query)),
    Effect.map((entries) => entries.map((entry) => toUnavailabilityView(entry))),
    Effect.provide(layer),
  );
  return runResolver('myUnavailability', program);
}
```

`resolvers/addUnavailability.ts`:

```ts
import { Effect, type Layer, pipe, Schema } from 'effect';

import {
  AddUnavailabilityCommand,
  AddUnavailabilityHandler,
} from '#context-user/application/commands';
import type { UserRepository } from '#context-user/domain';
import { UserServicesLive } from '#context-user/infrastructure/dynamodb';
import { stripNulls, toRecord } from '#context-user/interface/graphql/args';
import { runResolver } from '#context-user/interface/graphql/errors';
import {
  toUnavailabilityFields,
  toUnavailabilityView,
  type UnavailabilityView,
} from '#context-user/interface/graphql/unavailabilityMapping';

export function addUnavailability(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<UnavailabilityView> {
  const args = toRecord(stripNulls(input));
  const program = pipe(
    Schema.decodeUnknown(AddUnavailabilityCommand)({
      ...toUnavailabilityFields(toRecord(args.input)),
      userId: args.userId,
    }),
    Effect.flatMap((command) => AddUnavailabilityHandler.execute(command)),
    Effect.map((entry) => toUnavailabilityView(entry)),
    Effect.provide(layer),
  );
  return runResolver('addUnavailability', program);
}
```

`resolvers/updateUnavailability.ts` — same imports as `addUnavailability.ts`, with
`UpdateUnavailabilityCommand` / `UpdateUnavailabilityHandler`:

```ts
import { Effect, type Layer, pipe, Schema } from 'effect';

import {
  UpdateUnavailabilityCommand,
  UpdateUnavailabilityHandler,
} from '#context-user/application/commands';
import type { UserRepository } from '#context-user/domain';
import { UserServicesLive } from '#context-user/infrastructure/dynamodb';
import { stripNulls, toRecord } from '#context-user/interface/graphql/args';
import { runResolver } from '#context-user/interface/graphql/errors';
import {
  toUnavailabilityFields,
  toUnavailabilityView,
  type UnavailabilityView,
} from '#context-user/interface/graphql/unavailabilityMapping';

export function updateUnavailability(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<UnavailabilityView> {
  const args = toRecord(stripNulls(input));
  const program = pipe(
    Schema.decodeUnknown(UpdateUnavailabilityCommand)({
      ...toUnavailabilityFields(toRecord(args.input)),
      id: args.id,
      userId: args.userId,
    }),
    Effect.flatMap((command) => UpdateUnavailabilityHandler.execute(command)),
    Effect.map((entry) => toUnavailabilityView(entry)),
    Effect.provide(layer),
  );
  return runResolver('updateUnavailability', program);
}
```

`resolvers/removeUnavailability.ts`:

```ts
import { Effect, type Layer, pipe, Schema } from 'effect';

import {
  RemoveUnavailabilityCommand,
  RemoveUnavailabilityHandler,
} from '#context-user/application/commands';
import type { UserRepository } from '#context-user/domain';
import { UserServicesLive } from '#context-user/infrastructure/dynamodb';
import { stripNulls } from '#context-user/interface/graphql/args';
import { runResolver } from '#context-user/interface/graphql/errors';

export function removeUnavailability(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<boolean> {
  const program = pipe(
    Schema.decodeUnknown(RemoveUnavailabilityCommand)(stripNulls(input)),
    Effect.flatMap((command) => RemoveUnavailabilityHandler.execute(command)),
    Effect.provide(layer),
  );
  return runResolver('removeUnavailability', program);
}
```

`resolvers/index.ts`:

```ts
export * from './addUnavailability';
export * from './myProfile';
export * from './myUnavailability';
export * from './removeUnavailability';
export * from './saveMyProfile';
export * from './updateUnavailability';
```

`packages/context-user/src/interface/graphql/index.ts`:

```ts
export * from './errors';
export * as resolvers from './resolvers';
export type { UnavailabilityView } from './unavailabilityMapping';
```

`packages/context-user/src/interface/index.ts`: `export * as graphql from './graphql';`

Add to `packages/context-user/src/index.ts`: `export * as UserInterface from './interface';`

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm vitest run --project context-user`
Expected: PASS.

- [ ] **Step 7: Build and lint the package**

Run: `pnpm --filter @chordcraft/context-user build && pnpm --filter @chordcraft/context-user typecheck && pnpm eslint packages/context-user`
Expected: exit 0; `packages/context-user/build/index.js` exists.

- [ ] **Step 8: Commit**

```bash
git add packages/context-user
git commit -m "feat(context-user): expose profiles and unavailability over GraphQL"
```

---

### Task 13: `api-user` Lambda

**Files:**

- Create: `packages/api-user/{package.json,tsconfig.json,tsconfig.build.json,tsconfig.test.json,vitest.config.ts,setupTests.ts}`
- Create: `packages/api-user/src/index.ts`, `packages/api-user/test/index.test.ts`
- Modify (root): `tsconfig.base.json` (`paths`), `tsconfig.build.json`, `vitest.config.ts`

**Interfaces:**

- Consumes: `UserInterface.graphql.resolvers` from `@chordcraft/context-user`; the authorizer's
  `resolverContext` (`userId`, `email`).
- Produces: `handler(event: AppSyncResolverEvent<Record<string, unknown>>): Promise<unknown>`
  routing `myProfile`, `myUnavailability`, `saveMyProfile`, `addUnavailability`,
  `updateUnavailability`, `removeUnavailability`.

- [ ] **Step 1: Create the package**

`packages/api-user/package.json`:

```json
{
  "name": "@chordcraft/api-user",
  "version": "1.0.0",
  "description": "AppSync Lambda resolver for musician profiles",
  "keywords": [],
  "license": "ISC",
  "author": "Speira",
  "imports": {
    "#api-user/*": "./src/*"
  },
  "exports": {
    ".": {
      "types": "./build/index.d.ts",
      "import": "./build/index.js",
      "require": "./build/index.js"
    }
  },
  "main": "./build/index.js",
  "types": "./build/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "check": "tsc -b tsconfig.json --noEmit",
    "test": "vitest",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@chordcraft/context-user": "workspace:*",
    "@chordcraft/shared": "workspace:*",
    "effect": "^3.19.12"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.159",
    "vitest": "^4.0.16"
  }
}
```

Copy from `packages/api-chart/`: `tsconfig.json`, `tsconfig.test.json`, `setupTests.ts`.
Copy `packages/context-chart/vitest.config.ts` (the modern one using `tsconfigPaths` and
`workspaceAliases`). Create `packages/api-user/tsconfig.build.json` as a copy of api-chart's,
with the second reference changed to `{ "path": "../context-user/tsconfig.build.json" }`.

Root:

- `tsconfig.base.json` `paths`: add `"#api-user/*": ["./packages/api-user/src/*"],` after
  `#api-chart/*`.
- `tsconfig.build.json`: add `{ "path": "packages/api-user/tsconfig.build.json" }`.
- `vitest.config.ts`: add `project('api-user'),` after `project('api-chart'),`.

Run: `pnpm install`
Expected: exit 0.

- [ ] **Step 2: Write the failing test**

`packages/api-user/test/index.test.ts`:

```ts
import { UserInterface } from '@chordcraft/context-user';
import type { AppSyncResolverEvent } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handler } from '#api-user/index';

vi.mock('@chordcraft/context-user', () => ({
  UserInterface: {
    graphql: {
      resolvers: {
        myProfile: vi.fn(() => Promise.resolve(null)),
        myUnavailability: vi.fn(() => Promise.resolve([])),
        saveMyProfile: vi.fn(() => Promise.resolve({ userId: 'user_1' })),
        addUnavailability: vi.fn(() => Promise.resolve({ id: 'u1' })),
        updateUnavailability: vi.fn(() => Promise.resolve({ id: 'u1' })),
        removeUnavailability: vi.fn(() => Promise.resolve(true)),
      },
    },
  },
}));

const { resolvers } = UserInterface.graphql;

const makeEvent = (opts: {
  fieldName?: string;
  args?: Record<string, unknown>;
  identity?: unknown;
}): AppSyncResolverEvent<Record<string, unknown>> =>
  ({
    info: { fieldName: opts.fieldName ?? 'myProfile' },
    arguments: opts.args ?? {},
    identity:
      'identity' in opts
        ? opts.identity
        : {
            resolverContext: {
              userId: 'user_1',
              tenantId: 'user_1',
              email: 'a@b.co',
              emailVerified: 'true',
            },
          },
  }) as unknown as AppSyncResolverEvent<Record<string, unknown>>;

describe('api-user handler', { concurrent: false }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a request without an identity context', async () => {
    await expect(handler(makeEvent({ identity: null }))).rejects.toThrow(
      'Unauthorized: No identity context',
    );
    expect(resolvers.myProfile).not.toHaveBeenCalled();
  });

  it('rejects a context without a user', async () => {
    await expect(handler(makeEvent({ identity: { resolverContext: {} } }))).rejects.toThrow(
      'Unauthorized: No user',
    );
  });

  it('injects the authenticated caller over any client-supplied identity', async () => {
    await handler(
      makeEvent({
        fieldName: 'saveMyProfile',
        args: { input: { name: 'Ana' }, userId: 'user_attacker', email: 'evil@x.co' },
      }),
    );

    expect(resolvers.saveMyProfile).toHaveBeenCalledWith({
      input: { name: 'Ana' },
      userId: 'user_1',
      email: 'a@b.co',
    });
  });

  it.each([
    'myProfile',
    'myUnavailability',
    'saveMyProfile',
    'addUnavailability',
    'updateUnavailability',
    'removeUnavailability',
  ] as const)('routes %s to its resolver', async (fieldName) => {
    await handler(makeEvent({ fieldName }));

    expect(resolvers[fieldName]).toHaveBeenCalledOnce();
  });

  it('rejects an unknown field', async () => {
    await expect(handler(makeEvent({ fieldName: 'dropTable' }))).rejects.toThrow(
      'Unknown field: dropTable',
    );
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run --project api-user`
Expected: FAIL — `#api-user/index` cannot be resolved.

- [ ] **Step 4: Implement**

`packages/api-user/src/index.ts`:

```ts
import { UserInterface } from '@chordcraft/context-user';
import type { AppSyncResolverEvent } from 'aws-lambda';

interface ResolverContext {
  userId?: string;
  email?: string;
}

/**
 * AppSync entry point for musician profiles. The caller is always the authenticated user: `userId`
 * and `email` from the authorizer overwrite anything the client sent.
 */
export async function handler(
  event: AppSyncResolverEvent<Record<string, unknown>>,
): Promise<unknown> {
  const { fieldName } = event.info;

  if (!event.identity || !('resolverContext' in event.identity)) {
    throw new Error('Unauthorized: No identity context');
  }
  const context = event.identity.resolverContext as ResolverContext;
  if (!context.userId) {
    throw new Error('Unauthorized: No user');
  }

  const input = { ...event.arguments, userId: context.userId, email: context.email ?? '' };
  const { resolvers } = UserInterface.graphql;

  switch (fieldName) {
    case 'myProfile':
      return resolvers.myProfile(input);
    case 'myUnavailability':
      return resolvers.myUnavailability(input);
    case 'saveMyProfile':
      return resolvers.saveMyProfile(input);
    case 'addUnavailability':
      return resolvers.addUnavailability(input);
    case 'updateUnavailability':
      return resolvers.updateUnavailability(input);
    case 'removeUnavailability':
      return resolvers.removeUnavailability(input);
    default:
      throw new Error(`Unknown field: ${fieldName}`);
  }
}
```

- [ ] **Step 5: Run the tests and build**

Run: `pnpm vitest run --project api-user && pnpm --filter @chordcraft/api-user build`
Expected: PASS; `packages/api-user/build/index.js` exists.

- [ ] **Step 6: Commit**

```bash
git add packages/api-user tsconfig.base.json tsconfig.build.json vitest.config.ts pnpm-lock.yaml
git commit -m "feat(api-user): add the Lambda resolver for musician profiles"
```

---

### Task 14: Deploy the users table, the user Lambda and the merged schema

**Files:**

- Modify: `packages/deployment/package.json` (devDependencies, dependency on `api-user`)
- Modify: `packages/deployment/bin/mergeSchemas.ts`
- Replace: `packages/deployment/test/bin/mergeSchema.unit.test.ts` (it nests `it` in `it` and
  fails today)
- Modify: `packages/deployment/src/constants.ts`, `src/ChordsChartStack.ts`,
  `src/constructParts/{Database,Lambdas,AppSync,Monitoring}.construct.ts`
- Modify: `packages/deployment/README.md`, root `knip.jsonc`

**Interfaces:**

- Consumes: `packages/api-user/build` (Task 13), the context schemas.
- Produces: table `${stack}-users` (PK, SK, LSI1 on `LSI1SK`), Lambda `UserFunction`
  (`USERS_TABLE` env), AppSync resolvers for the six `context-user` fields, one merged schema
  with a single `Query` and a single `Mutation`.

- [ ] **Step 1: Write the failing test**

Two contexts both declare `type Query` and `type Mutation`, and the current script concatenates
them into an invalid schema. Replace `packages/deployment/test/bin/mergeSchema.unit.test.ts` with:

```ts
import { CONTEXTS_PATHS, contextsSchemas, mergeSchemas } from '../../bin/mergeSchemas';

describe('bin/mergeSchemas', () => {
  it('reads a schema for every context', () => {
    expect(contextsSchemas).toHaveLength(CONTEXTS_PATHS.length);
  });

  it('merges the root types of several contexts into one', () => {
    const merged = mergeSchemas([
      'type Query { a: Int }',
      'type Query { b: Int }\ntype Mutation { c: Int }',
    ]);

    expect(merged.match(/type Query/g)).toHaveLength(1);
    expect(merged.match(/type Mutation/g)).toHaveLength(1);
    expect(merged).toContain('a: Int');
    expect(merged).toContain('b: Int');
  });
});
```

Run: `cd packages/deployment && pnpm exec jest test/bin`
Expected: FAIL — `mergeSchemas` is not exported.

- [ ] **Step 2: Merge schemas with graphql-tools**

Run: `pnpm --filter @chordcraft/deployment add -D @graphql-tools/merge@^9.1.1 graphql@^16.12.0`
and `pnpm --filter @chordcraft/deployment add @chordcraft/api-user@workspace:*`.

Replace `packages/deployment/bin/mergeSchemas.ts` with:

```ts
import * as fs from 'node:fs';
import * as path from 'node:path';

import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';

export const CONTEXTS_PATHS = ['../../context-chart', '../../context-user'];

/** Merges the contexts' schemas so each root type (Query, Mutation) is declared once. */
export function mergeSchemas(sources: ReadonlyArray<string>): string {
  return print(mergeTypeDefs([...sources]));
}

export const contextsSchemas = CONTEXTS_PATHS.map((context) => {
  const schemaPath = path.join(__dirname, context, 'src/interface/graphql/schema.graphql');
  if (!fs.existsSync(schemaPath)) return '';
  return fs.readFileSync(schemaPath, 'utf-8');
}).filter(Boolean);

const outPath = path.join(__dirname, '../src/generated/schema.graphql');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, mergeSchemas(contextsSchemas));

console.log(`✅ Merged ${contextsSchemas.length} schemas into ${outPath}`);
```

Run: `cd packages/deployment && pnpm exec jest test/bin && pnpm merge-schemas && grep -c "^type Query" src/generated/schema.graphql`
Expected: tests PASS; the generated file has `1` `type Query`, and contains `myProfile` and
`listCharts`.

- [ ] **Step 3: Add the table**

In `Database.construct.ts`, add `public readonly usersTable: dynamodb.Table;` and, after the
projection table's GSI:

```ts
this.usersTable = new dynamodb.Table(this, 'UsersTable', {
  tableName: `${stackName}-users`,
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy,
  pointInTimeRecoverySpecification: {
    pointInTimeRecoveryEnabled: true,
  },
});

// Unavailability by start date; a local index keeps range reads strongly consistent.
this.usersTable.addLocalSecondaryIndex({
  indexName: 'LSI1',
  sortKey: { name: 'LSI1SK', type: dynamodb.AttributeType.STRING },
});
```

and an output `new cdk.CfnOutput(this, 'UsersTableName', { value: this.usersTable.tableName });`.

- [ ] **Step 4: Add the Lambda**

`constants.ts`: add `PACKAGES_API_USER: '../../api-user',` to `PATHS_FROM_SRC`.

`Lambdas.construct.ts`: add `readonly usersTable: dynamodb.ITable;` to the props,
`public readonly userFunction: lambda.Function;`, and after the chart function's grants:

```ts
this.userFunction = new lambda.Function(this, 'UserFunction', {
  code: lambda.Code.fromAsset(
    path.join(__dirname, `../${K.PATHS_FROM_SRC.PACKAGES_API_USER}/build`),
  ),
  handler: 'index.handler',
  environment: {
    LOG_LEVEL: 'INFO',
    NODE_OPTIONS: '--enable-source-maps',
    NODE_ENV: props.isProduction ? 'production' : 'development',
    USERS_TABLE: props.usersTable.tableName,
  },
  logGroup: new logs.LogGroup(this, `UserFunctionLogGroup-${stackName}`, {
    logGroupName: `/aws/lambda/user-function-${stackName}`,
    retention: logs.RetentionDays.ONE_WEEK,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  }),
  memorySize: 512,
  runtime: lambda.Runtime.NODEJS_18_X,
  timeout: cdk.Duration.seconds(10),
  tracing: lambda.Tracing.ACTIVE,
});

props.usersTable.grantReadWriteData(this.userFunction);
```

> Same runtime as the chart function on purpose; upgrading every function's runtime is a
> separate change.

- [ ] **Step 5: Add the resolvers and monitoring**

`AppSync.construct.ts`: add `readonly userFunction: lambda.IFunction;` to the props and, after
the chart resolvers:

```ts
const userDataSource = this.graphqlApi.addLambdaDataSource('UserDataSource', props.userFunction);

for (const fieldName of ['myProfile', 'myUnavailability']) {
  userDataSource.createResolver(`${fieldName}Resolver`, { typeName: 'Query', fieldName });
}
for (const fieldName of [
  'saveMyProfile',
  'addUnavailability',
  'updateUnavailability',
  'removeUnavailability',
]) {
  userDataSource.createResolver(`${fieldName}Resolver`, { typeName: 'Mutation', fieldName });
}
```

`Monitoring.construct.ts`: add `readonly userFunction: lambda.IFunction;` to the props, a third
metric to the "Lambda Errors" widget:

```ts
new cloudwatch.Metric({
  namespace: 'AWS/Lambda',
  metricName: 'Errors',
  statistic: 'Sum',
  period: cdk.Duration.minutes(5),
  dimensionsMap: {
    FunctionName: props.userFunction.functionName,
  },
}),
```

and, after the charts error alarm:

```ts
const usersAlarm = new cloudwatch.Alarm(this, 'UsersErrorAlarm', {
  metric: props.userFunction.metricErrors({
    statistic: 'Sum',
    period: cdk.Duration.minutes(5),
  }),
  threshold: 10,
  evaluationPeriods: 2,
  alarmDescription: 'Alert when users Lambda has high error rate',
  alarmName: `${props.stackName.toLowerCase()}-users-lambda-errors`,
});
usersAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
```

`ChordsChartStack.ts`: pass `usersTable: database.usersTable` to `LambdasConstruct`,
`userFunction: lambdas.userFunction` to `AppSynConstruct` and `MonitoringConstruct`, and add:

```ts
new cdk.CfnOutput(this, 'UsersTableName', {
  value: database.usersTable.tableName,
  description: 'DynamoDB Users table name',
  exportName: `${this.stackName}-users-table`,
});
```

`knip.jsonc`: add `"@chordcraft/api-user",` next to `"@chordcraft/api-chart",` under
`ignoreDependencies` (same reason: deployment ships it as a Lambda asset).

- [ ] **Step 6: Synthesize**

Run: `pnpm build && cd packages/deployment && pnpm typecheck && pnpm synth > /dev/null && grep -c '"LSI1"' cdk.out/*.template.json`
Expected: exit 0 and at least `1`. If `synth` needs AWS credentials in this environment, stop
after `pnpm typecheck` and report that synth was not run.

- [ ] **Step 7: Document**

In `packages/deployment/README.md`, change the `mergeSchemas.ts` comment to
`# Merges each context's schema into src/generated` and the "generated schema" paragraph's
"concatenates" to "merges (with `@graphql-tools/merge`, so each root type is declared once)".

- [ ] **Step 8: Commit**

```bash
git add packages/deployment knip.jsonc pnpm-lock.yaml
git commit -m "feat(deployment): deploy the users table, the user Lambda and a merged schema"
```

- [ ] **Step 9: Manual — deploy to dev**

Deploying is the user's call. Ask them to run `pnpm --filter @chordcraft/deployment deploy:dev`
after confirming the Clerk claim (Task 6, Step 7) is configured, and to check
`myProfile` returns `null` from the AppSync console for a signed-in user.

---

### Task 15: Client data layer for profiles

**Files:**

- Create: `packages/client-web/src/lib/graphql/errors.ts`
- Create: `packages/client-web/src/lib/graphql/queries/profileQueries.ts`
- Modify: `packages/client-web/src/lib/graphql/queries/index.ts`
- Create: `packages/client-web/src/features/profile/{types,hooks,index}.ts`
- Modify: `packages/client-web/src/lib/nextIntl/dictionaries/{en,fr}.json`

**Interfaces:**

- Consumes: the GraphQL API from Task 12.
- Produces:
  - `readGraphQLFailure(error: unknown): { errorType: string; message: string }`.
  - Documents `MY_PROFILE`, `SAVE_MY_PROFILE`, `MY_UNAVAILABILITY`, `ADD_UNAVAILABILITY`,
    `REMOVE_UNAVAILABILITY`.
  - Types `ProfileView`, `SaveProfileInput`, `UnavailabilityView`, `UnavailabilityInput`.
  - Hooks: `useMyProfile(): { profile, isLoading, error, reload }`,
    `useSaveMyProfile(): { saveProfile(input): Promise<ProfileView>, isSaving, error }`,
    `useMyUnavailability(range): { entries, isLoading, error, add(input), remove(id) }`.
    Every request sends the Clerk session token (`useAuth().getToken()`).
  - Dictionary namespaces `profile`, `musicianRole`, `musicStyle`, `skillLevel`,
    `contactChannel`, `roleFamily`.

- [ ] **Step 1: GraphQL documents and error reader**

`packages/client-web/src/lib/graphql/queries/profileQueries.ts`:

```ts
import { gql } from 'graphql-request';

const PROFILE_FIELDS = `
  userId
  name
  email
  phone
  preferredChannel
  region { country area }
  roles { role detail isPrimary level }
  styles { style detail }
  version
  createdAt
  updatedAt
`;

const UNAVAILABILITY_FIELDS = `
  id
  from
  to
  reason
  appliesToAllBands
  bandIds
`;

export const MY_PROFILE = gql`
  query MyProfile {
    myProfile { ${PROFILE_FIELDS} }
  }
`;

export const SAVE_MY_PROFILE = gql`
  mutation SaveMyProfile($input: SaveProfileInput!) {
    saveMyProfile(input: $input) { ${PROFILE_FIELDS} }
  }
`;

export const MY_UNAVAILABILITY = gql`
  query MyUnavailability($from: AWSDate!, $to: AWSDate!) {
    myUnavailability(from: $from, to: $to) { ${UNAVAILABILITY_FIELDS} }
  }
`;

export const ADD_UNAVAILABILITY = gql`
  mutation AddUnavailability($input: UnavailabilityInput!) {
    addUnavailability(input: $input) { ${UNAVAILABILITY_FIELDS} }
  }
`;

export const REMOVE_UNAVAILABILITY = gql`
  mutation RemoveUnavailability($id: ID!) {
    removeUnavailability(id: $id)
  }
`;
```

Add `export * from './profileQueries';` to `queries/index.ts`.

`packages/client-web/src/lib/graphql/errors.ts`:

```ts
import { ClientError } from 'graphql-request';

export interface GraphQLFailure {
  errorType: string;
  message: string;
}

/** AppSync puts the domain's error type on each GraphQL error (`VALIDATION`, `CONFLICT`, …). */
export function readGraphQLFailure(error: unknown): GraphQLFailure {
  if (error instanceof ClientError) {
    const first: unknown = error.response.errors?.[0];
    if (typeof first === 'object' && first !== null) {
      const errorType =
        'errorType' in first && typeof first.errorType === 'string' ? first.errorType : 'INTERNAL';
      const message = 'message' in first && typeof first.message === 'string' ? first.message : '';
      return { errorType, message };
    }
  }
  return { errorType: 'NETWORK', message: error instanceof Error ? error.message : String(error) };
}
```

Add `export * from './errors';` to `packages/client-web/src/lib/graphql/index.ts`.

- [ ] **Step 2: Types and hooks**

`packages/client-web/src/features/profile/types.ts`:

```ts
import type {
  ContactChannel,
  MusicianRole,
  MusicStyle,
  SkillLevel,
} from '@chordcraft/shared/valueObjects';

export interface RoleTagView {
  role: MusicianRole.Slug;
  detail: string | null;
  isPrimary: boolean;
  level: SkillLevel.SkillLevel | null;
}

export interface StyleTagView {
  style: MusicStyle.Slug;
  detail: string | null;
}

export interface ProfileView {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  preferredChannel: ContactChannel.ContactChannel;
  region: { country: string; area: string | null } | null;
  roles: Array<RoleTagView>;
  styles: Array<StyleTagView>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveProfileInput {
  name: string;
  phone: string | null;
  preferredChannel: ContactChannel.ContactChannel;
  region: { country: string; area: string | null } | null;
  roles: Array<RoleTagView>;
  styles: Array<StyleTagView>;
}

export interface UnavailabilityView {
  id: string;
  from: string;
  to: string;
  reason: string | null;
  appliesToAllBands: boolean;
  bandIds: Array<string>;
}

export interface UnavailabilityInput {
  from: string;
  to: string;
  reason: string | null;
}
```

`packages/client-web/src/features/profile/hooks.ts`:

```ts
'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@clerk/nextjs';

import {
  getGraphQLClient,
  type GraphQLFailure,
  queries,
  readGraphQLFailure,
} from '#client-web/lib/graphql';

import type {
  ProfileView,
  SaveProfileInput,
  UnavailabilityInput,
  UnavailabilityView,
} from './types';

/** A GraphQL client carrying the current Clerk session token. */
function useAuthorizedRequest() {
  const { getToken } = useAuth();
  return useCallback(
    async <T>(document: string, variables?: Record<string, unknown>): Promise<T> => {
      const token = await getToken();
      return getGraphQLClient(token ?? undefined).request<T>(document, variables);
    },
    [getToken],
  );
}

export function useMyProfile() {
  const request = useAuthorizedRequest();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<GraphQLFailure | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<{ myProfile: ProfileView | null }>(queries.MY_PROFILE);
      setProfile(data.myProfile);
    } catch (err) {
      setError(readGraphQLFailure(err));
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, isLoading, error, reload };
}

export function useSaveMyProfile() {
  const request = useAuthorizedRequest();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<GraphQLFailure | null>(null);

  /** Resolves with the saved profile; rejects after setting `error`. */
  const saveProfile = async (input: SaveProfileInput): Promise<ProfileView> => {
    setIsSaving(true);
    setError(null);
    try {
      const data = await request<{ saveMyProfile: ProfileView }>(queries.SAVE_MY_PROFILE, {
        input,
      });
      return data.saveMyProfile;
    } catch (err) {
      const failure = readGraphQLFailure(err);
      setError(failure);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveProfile, isSaving, error };
}

export function useMyUnavailability(range: { from: string; to: string }) {
  const request = useAuthorizedRequest();
  const [entries, setEntries] = useState<Array<UnavailabilityView>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<GraphQLFailure | null>(null);
  const { from, to } = range;

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<{ myUnavailability: Array<UnavailabilityView> }>(
        queries.MY_UNAVAILABILITY,
        { from, to },
      );
      setEntries(data.myUnavailability);
    } catch (err) {
      setError(readGraphQLFailure(err));
    } finally {
      setIsLoading(false);
    }
  }, [request, from, to]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = async (input: UnavailabilityInput) => {
    setError(null);
    try {
      await request(queries.ADD_UNAVAILABILITY, { input });
      await reload();
    } catch (err) {
      setError(readGraphQLFailure(err));
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await request(queries.REMOVE_UNAVAILABILITY, { id });
      await reload();
    } catch (err) {
      setError(readGraphQLFailure(err));
    }
  };

  return { entries, isLoading, error, add, remove };
}
```

`packages/client-web/src/features/profile/index.ts` is written in Task 16 (it exports the page).

- [ ] **Step 3: Dictionaries**

Add these top-level namespaces to `en.json` (keys kept alphabetical within each namespace, as
the file already is):

```json
"contactChannel": {
  "EMAIL": "Email",
  "PHONE_CALL": "Phone call",
  "SMS": "SMS",
  "WHATSAPP": "WhatsApp"
},
"musicStyle": {
  "blues": "Blues", "classical": "Classical", "electronic": "Electronic", "folk": "Folk",
  "funk": "Funk", "gospel": "Gospel", "hip-hop": "Hip-hop", "jazz": "Jazz", "latin": "Latin",
  "metal": "Metal", "other": "Other", "pop": "Pop", "reggae": "Reggae", "rock": "Rock",
  "soul": "Soul", "world": "World"
},
"musicianRole": {
  "backing-vocals": "Backing vocals", "bass": "Bass", "cello": "Cello", "clarinet": "Clarinet",
  "dj": "DJ", "double-bass": "Double bass", "drums": "Drums", "flute": "Flute",
  "guitar": "Guitar", "keyboards": "Keyboards", "lead-vocals": "Lead vocals",
  "music-director": "Music director", "organ": "Organ", "other": "Other",
  "percussion": "Percussion", "piano": "Piano", "saxophone": "Saxophone",
  "sound-engineer": "Sound engineer", "synth": "Synth", "trombone": "Trombone",
  "trumpet": "Trumpet", "viola": "Viola", "violin": "Violin"
},
"profile": {
  "addRole": "Add a role",
  "addStyle": "Add a style",
  "addUnavailability": "Add",
  "allBands": "All my bands",
  "area": "Region or city",
  "channel": "Preferred contact",
  "country": "Country",
  "detail": "Which one?",
  "email": "Email (from your account)",
  "errors": {
    "CONFLICT": "Your profile changed in another tab. Reload and try again.",
    "INTERNAL": "Something went wrong. Please try again.",
    "NETWORK": "Could not reach the server.",
    "VALIDATION": "Please check the highlighted fields."
  },
  "from": "From",
  "level": "Level",
  "levelNone": "Not specified",
  "name": "Name",
  "noUnavailability": "No unavailability recorded.",
  "phone": "Phone (international, e.g. +33612345678)",
  "primary": "Main role",
  "reason": "Reason (optional)",
  "remove": "Remove",
  "roles": "What I play",
  "rules": {
    "DETAIL_ONLY_FOR_OTHER": "Only \"Other\" takes a description.",
    "DETAIL_REQUIRED_FOR_OTHER": "Describe what \"Other\" means.",
    "DUPLICATE_ROLE": "Each role can appear once.",
    "DUPLICATE_STYLE": "Each style can appear once.",
    "PHONE_REQUIRED_FOR_CHANNEL": "This contact channel needs a phone number.",
    "SINGLE_PRIMARY_ROLE": "Only one role can be your main one."
  },
  "save": "Save my profile",
  "saved": "Profile saved.",
  "styles": "Styles I like",
  "title": "My musician profile",
  "to": "To",
  "unavailability": "When I'm unavailable"
},
"roleFamily": {
  "BRASS_WINDS": "Brass & winds", "DRUMS_PERCUSSION": "Drums & percussion", "KEYS": "Keys",
  "OTHER": "Other", "STRINGS": "Strings", "TECH": "Tech", "VOCALS": "Vocals"
},
"skillLevel": {
  "ADVANCED": "★★★ Advanced",
  "BEGINNER": "★ Beginner",
  "INTERMEDIATE": "★★ Intermediate",
  "MASTER": "★★★★★ Master",
  "PROFESSIONAL": "★★★★ Professional"
}
```

Add the same keys to `fr.json`, translated:

```json
"contactChannel": { "EMAIL": "E-mail", "PHONE_CALL": "Appel", "SMS": "SMS", "WHATSAPP": "WhatsApp" },
"musicStyle": {
  "blues": "Blues", "classical": "Classique", "electronic": "Électro", "folk": "Folk",
  "funk": "Funk", "gospel": "Gospel", "hip-hop": "Hip-hop", "jazz": "Jazz", "latin": "Latino",
  "metal": "Metal", "other": "Autre", "pop": "Pop", "reggae": "Reggae", "rock": "Rock",
  "soul": "Soul", "world": "Musiques du monde"
},
"musicianRole": {
  "backing-vocals": "Chœurs", "bass": "Basse", "cello": "Violoncelle", "clarinet": "Clarinette",
  "dj": "DJ", "double-bass": "Contrebasse", "drums": "Batterie", "flute": "Flûte",
  "guitar": "Guitare", "keyboards": "Claviers", "lead-vocals": "Chant lead",
  "music-director": "Directeur musical", "organ": "Orgue", "other": "Autre",
  "percussion": "Percussions", "piano": "Piano", "saxophone": "Saxophone",
  "sound-engineer": "Ingé son", "synth": "Synthé", "trombone": "Trombone",
  "trumpet": "Trompette", "viola": "Alto", "violin": "Violon"
},
"profile": {
  "addRole": "Ajouter un rôle",
  "addStyle": "Ajouter un style",
  "addUnavailability": "Ajouter",
  "allBands": "Tous mes groupes",
  "area": "Région ou ville",
  "channel": "Contact préféré",
  "country": "Pays",
  "detail": "Lequel ?",
  "email": "E-mail (celui de votre compte)",
  "errors": {
    "CONFLICT": "Votre profil a changé dans un autre onglet. Rechargez et réessayez.",
    "INTERNAL": "Une erreur est survenue. Réessayez.",
    "NETWORK": "Impossible de joindre le serveur.",
    "VALIDATION": "Vérifiez les champs indiqués."
  },
  "from": "Du",
  "level": "Niveau",
  "levelNone": "Non précisé",
  "name": "Nom",
  "noUnavailability": "Aucune indisponibilité.",
  "phone": "Téléphone (international, ex. +33612345678)",
  "primary": "Rôle principal",
  "reason": "Motif (facultatif)",
  "remove": "Supprimer",
  "roles": "Ce que je joue",
  "rules": {
    "DETAIL_ONLY_FOR_OTHER": "Seul « Autre » prend une description.",
    "DETAIL_REQUIRED_FOR_OTHER": "Précisez ce que recouvre « Autre ».",
    "DUPLICATE_ROLE": "Chaque rôle ne peut apparaître qu'une fois.",
    "DUPLICATE_STYLE": "Chaque style ne peut apparaître qu'une fois.",
    "PHONE_REQUIRED_FOR_CHANNEL": "Ce moyen de contact nécessite un numéro.",
    "SINGLE_PRIMARY_ROLE": "Un seul rôle peut être principal."
  },
  "save": "Enregistrer mon profil",
  "saved": "Profil enregistré.",
  "styles": "Styles préférés",
  "title": "Mon profil de musicien",
  "to": "Au",
  "unavailability": "Mes indisponibilités"
},
"roleFamily": {
  "BRASS_WINDS": "Cuivres & vents", "DRUMS_PERCUSSION": "Batterie & percussions",
  "KEYS": "Claviers", "OTHER": "Autre", "STRINGS": "Cordes", "TECH": "Technique",
  "VOCALS": "Chant"
},
"skillLevel": {
  "ADVANCED": "★★★ Confirmé",
  "BEGINNER": "★ Débutant",
  "INTERMEDIATE": "★★ Intermédiaire",
  "MASTER": "★★★★★ Maître",
  "PROFESSIONAL": "★★★★ Professionnel"
}
```

Run `pnpm prettier --write packages/client-web/src/lib/nextIntl/dictionaries` to lay the JSON
out one key per line.

- [ ] **Step 4: Type-check**

Run: `pnpm --filter @chordcraft/client-web typecheck`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/client-web
git commit -m "feat(client-web): add the profile GraphQL documents, hooks and labels"
```

---

### Task 16: The `/profile` page

**Files:**

- Create: `packages/client-web/src/features/profile/{ProfileForm,UnavailabilityList,ProfilePage,profileForm}.tsx|ts`, `index.ts`
- Create: `packages/client-web/src/app/[locale]/profile/page.tsx`
- Modify: `packages/client-web/src/components/layout/HeaderNavigation.tsx`

**Interfaces:**

- Consumes: Task 15 hooks, types and labels; `MusicianRole.FAMILIES`, `MusicStyle.ALL`,
  `SkillLevel.LEVELS`, `ContactChannel.CHANNELS`, `CountryCode.ALL`, `LocalDate.addDays`.
- Produces: `ProfilePage` (client component) and the `/[locale]/profile` route, reachable from
  the header ("My musician profile"). Clerk's `proxy.ts` already protects every non-public
  route, so no change there.

- [ ] **Step 1: Form mapping (pure, the one piece with logic)**

`packages/client-web/src/features/profile/profileForm.ts`:

```ts
import type { ProfileView, SaveProfileInput } from './types';

/** The form edits strings; an empty string means "not set". */
export interface ProfileFormValues {
  name: string;
  phone: string;
  preferredChannel: SaveProfileInput['preferredChannel'];
  country: string;
  area: string;
  roles: Array<{ role: string; detail: string; isPrimary: boolean; level: string }>;
  styles: Array<{ style: string; detail: string }>;
}

const orNull = (value: string) => (value.trim() === '' ? null : value.trim());

export function toFormValues(profile: ProfileView | null): ProfileFormValues {
  return {
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    preferredChannel: profile?.preferredChannel ?? 'WHATSAPP',
    country: profile?.region?.country ?? '',
    area: profile?.region?.area ?? '',
    roles: profile?.roles.map((tag) => ({
      role: tag.role,
      detail: tag.detail ?? '',
      isPrimary: tag.isPrimary,
      level: tag.level ?? '',
    })) ?? [{ role: 'guitar', detail: '', isPrimary: true, level: '' }],
    styles: profile?.styles.map((tag) => ({ style: tag.style, detail: tag.detail ?? '' })) ?? [],
  };
}

export function toSaveInput(values: ProfileFormValues): SaveProfileInput {
  const country = orNull(values.country);
  return {
    name: values.name.trim(),
    phone: orNull(values.phone),
    preferredChannel: values.preferredChannel,
    region: country === null ? null : { country, area: orNull(values.area) },
    roles: values.roles.map((tag) => ({
      role: tag.role as SaveProfileInput['roles'][number]['role'],
      detail: orNull(tag.detail),
      isPrimary: tag.isPrimary,
      level: (orNull(tag.level) as SaveProfileInput['roles'][number]['level']) ?? null,
    })),
    styles: values.styles.map((tag) => ({
      style: tag.style as SaveProfileInput['styles'][number]['style'],
      detail: orNull(tag.detail),
    })),
  };
}
```

> `client-web` has no unit-test project; this mapping is checked by the manual run in Step 5.
> The server validates every value again, so a wrong cast here surfaces as a `VALIDATION`
> error, never as bad data.

- [ ] **Step 2: The profile form**

`packages/client-web/src/features/profile/ProfileForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import {
  ContactChannel,
  CountryCode,
  MusicianRole,
  MusicStyle,
  SkillLevel,
} from '@chordcraft/shared/valueObjects';
import { useLocale } from 'next-intl';

import { Button, Input, Label, Typography } from '#client-web/components';
import { useAppTranslations } from '#client-web/lib/nextIntl/useAppTranslation';

import { useSaveMyProfile } from './hooks';
import { type ProfileFormValues, toFormValues, toSaveInput } from './profileForm';
import type { ProfileView } from './types';

const SELECT_CLASS = 'border-input bg-background h-9 w-full rounded-md border px-3 text-sm';

export function ProfileForm({ email, profile }: { email: string; profile: ProfileView | null }) {
  const t = useAppTranslations();
  const locale = useLocale();
  const { error, isSaving, saveProfile } = useSaveMyProfile();
  const [isSaved, setIsSaved] = useState(false);
  const { control, handleSubmit, register, watch } = useForm<ProfileFormValues>({
    defaultValues: toFormValues(profile),
  });
  const roles = useFieldArray({ control, name: 'roles' });
  const styles = useFieldArray({ control, name: 'styles' });
  const countryNames = new Intl.DisplayNames([locale], { type: 'region' });

  const onSubmit = handleSubmit(async (values) => {
    setIsSaved(false);
    try {
      await saveProfile(toSaveInput(values));
      setIsSaved(true);
    } catch {
      // `error` is set by the hook and rendered below.
    }
  });

  const ruleMessage =
    error?.errorType === 'VALIDATION' && error.message in RULE_KEYS
      ? t(RULE_KEYS[error.message as keyof typeof RULE_KEYS])
      : null;

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-2xl flex-col gap-4">
      <Typography as="h2">{t('profile.title')}</Typography>

      <Label>
        {t('profile.name')}
        <Input {...register('name', { required: true, maxLength: 100 })} />
      </Label>
      <Label>
        {t('profile.email')}
        <Input value={email} disabled readOnly />
      </Label>
      <Label>
        {t('profile.channel')}
        <select className={SELECT_CLASS} {...register('preferredChannel')}>
          {ContactChannel.CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {t(`contactChannel.${channel}`)}
            </option>
          ))}
        </select>
      </Label>
      <Label>
        {t('profile.phone')}
        <Input type="tel" {...register('phone')} />
      </Label>
      <div className="grid grid-cols-2 gap-4">
        <Label>
          {t('profile.country')}
          <select className={SELECT_CLASS} {...register('country')}>
            <option value="">—</option>
            {CountryCode.ALL.map((code) => (
              <option key={code} value={code}>
                {countryNames.of(code) ?? code}
              </option>
            ))}
          </select>
        </Label>
        <Label>
          {t('profile.area')}
          <Input {...register('area')} />
        </Label>
      </div>

      <Typography as="h3">{t('profile.roles')}</Typography>
      {roles.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[2fr_2fr_2fr_auto_auto] items-end gap-2">
          <select className={SELECT_CLASS} {...register(`roles.${index}.role`)}>
            {Object.entries(MusicianRole.FAMILIES).map(([family, slugs]) => (
              <optgroup key={family} label={t(`roleFamily.${family as MusicianRole.Family}`)}>
                {slugs.map((slug) => (
                  <option key={slug} value={slug}>
                    {t(`musicianRole.${slug}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {watch(`roles.${index}.role`) === MusicianRole.OTHER ? (
            <Input placeholder="profile.detail" {...register(`roles.${index}.detail`)} />
          ) : (
            <span />
          )}
          <select className={SELECT_CLASS} {...register(`roles.${index}.level`)}>
            <option value="">{t('profile.levelNone')}</option>
            {SkillLevel.LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(`skillLevel.${level}`)}
              </option>
            ))}
          </select>
          <Label className="flex items-center gap-1">
            <input type="checkbox" {...register(`roles.${index}.isPrimary`)} />
            {t('profile.primary')}
          </Label>
          <Button type="button" variant="ghost" onClick={() => roles.remove(index)}>
            {t('profile.remove')}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={roles.fields.length >= 10}
        onClick={() => roles.append({ role: 'guitar', detail: '', isPrimary: false, level: '' })}>
        {t('profile.addRole')}
      </Button>

      <Typography as="h3">{t('profile.styles')}</Typography>
      {styles.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[2fr_2fr_auto] items-end gap-2">
          <select className={SELECT_CLASS} {...register(`styles.${index}.style`)}>
            {MusicStyle.ALL.map((slug) => (
              <option key={slug} value={slug}>
                {t(`musicStyle.${slug}`)}
              </option>
            ))}
          </select>
          {watch(`styles.${index}.style`) === MusicStyle.OTHER ? (
            <Input placeholder="profile.detail" {...register(`styles.${index}.detail`)} />
          ) : (
            <span />
          )}
          <Button type="button" variant="ghost" onClick={() => styles.remove(index)}>
            {t('profile.remove')}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={styles.fields.length >= 20}
        onClick={() => styles.append({ style: 'jazz', detail: '' })}>
        {t('profile.addStyle')}
      </Button>

      {error && (
        <p className="text-destructive" role="alert">
          {ruleMessage ??
            t(ERROR_KEYS[error.errorType as keyof typeof ERROR_KEYS] ?? ERROR_KEYS.INTERNAL)}
          {error.errorType === 'VALIDATION' && ruleMessage === null ? ` (${error.message})` : null}
        </p>
      )}
      {isSaved && <p role="status">{t('profile.saved')}</p>}

      <Button type="submit" disabled={isSaving}>
        {t('profile.save')}
      </Button>
    </form>
  );
}

const RULE_KEYS = {
  DETAIL_ONLY_FOR_OTHER: 'profile.rules.DETAIL_ONLY_FOR_OTHER',
  DETAIL_REQUIRED_FOR_OTHER: 'profile.rules.DETAIL_REQUIRED_FOR_OTHER',
  DUPLICATE_ROLE: 'profile.rules.DUPLICATE_ROLE',
  DUPLICATE_STYLE: 'profile.rules.DUPLICATE_STYLE',
  PHONE_REQUIRED_FOR_CHANNEL: 'profile.rules.PHONE_REQUIRED_FOR_CHANNEL',
  SINGLE_PRIMARY_ROLE: 'profile.rules.SINGLE_PRIMARY_ROLE',
} as const;

const ERROR_KEYS = {
  CONFLICT: 'profile.errors.CONFLICT',
  INTERNAL: 'profile.errors.INTERNAL',
  NETWORK: 'profile.errors.NETWORK',
  VALIDATION: 'profile.errors.VALIDATION',
} as const;
```

> `Button` forwards `variant` to the shadcn button (`default`, `outline`, `ghost`, …). `Label`
> is Radix's `<label>`, so wrapping the control makes the whole row clickable. The
> `musicianRole.<slug>`-style keys are typed by next-intl from `en.json`, which Task 15
> filled, so a missing label is a type error.

- [ ] **Step 3: Unavailability list and the page**

`packages/client-web/src/features/profile/UnavailabilityList.tsx`:

```tsx
'use client';

import { useState } from 'react';

import { Button, Input, Label, Typography } from '#client-web/components';
import { useAppTranslations } from '#client-web/lib/nextIntl/useAppTranslation';

import { useMyUnavailability } from './hooks';

/** Today and the following 365 days: the widest window one query allows (366 days). */
function nextYear(): { from: string; to: string } {
  const from = new Date();
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 365);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function UnavailabilityList() {
  const t = useAppTranslations();
  const [period] = useState(nextYear);
  const { add, entries, error, isLoading, remove } = useMyUnavailability(period);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');

  const onAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    await add({ from, to: to || from, reason: reason.trim() === '' ? null : reason.trim() });
    setFrom('');
    setTo('');
    setReason('');
  };

  return (
    <section className="flex w-full max-w-2xl flex-col gap-3">
      <Typography as="h3">{t('profile.unavailability')}</Typography>
      {!isLoading && entries.length === 0 && <p>{t('profile.noUnavailability')}</p>}
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-2">
            <span>
              {entry.from === entry.to ? entry.from : `${entry.from} → ${entry.to}`}
              {entry.reason ? ` · ${entry.reason}` : ''}
              {entry.appliesToAllBands ? ` · ${t('profile.allBands')}` : ''}
            </span>
            <Button type="button" variant="ghost" onClick={() => void remove(entry.id)}>
              {t('profile.remove')}
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={onAdd} className="grid grid-cols-[1fr_1fr_2fr_auto] items-end gap-2">
        <Label>
          {t('profile.from')}
          <Input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} />
        </Label>
        <Label>
          {t('profile.to')}
          <Input type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />
        </Label>
        <Label>
          {t('profile.reason')}
          <Input maxLength={100} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Label>
        <Button type="submit">{t('profile.addUnavailability')}</Button>
      </form>
      {error && (
        <p className="text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </section>
  );
}
```

`packages/client-web/src/features/profile/ProfilePage.tsx`:

```tsx
'use client';

import { useUser } from '@clerk/nextjs';

import { Loader } from '#client-web/components';

import { useMyProfile } from './hooks';
import { ProfileForm } from './ProfileForm';
import { UnavailabilityList } from './UnavailabilityList';

export function ProfilePage() {
  const { user } = useUser();
  const { isLoading, profile } = useMyProfile();

  if (isLoading) return <Loader />;

  return (
    <>
      <ProfileForm
        email={profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? ''}
        profile={profile}
      />
      <UnavailabilityList />
    </>
  );
}
```

`packages/client-web/src/features/profile/index.ts`: `export * from './ProfilePage';`

`packages/client-web/src/app/[locale]/profile/page.tsx`:

```tsx
import { Main } from '#client-web/components';
import { ProfilePage } from '#client-web/features/profile';

export default function MusicianProfilePage() {
  return (
    <Main>
      <ProfilePage />
    </Main>
  );
}
```

In `HeaderNavigation.tsx`, add `{ href: '/profile', label: 'profile.title' },` to `navItems`.

- [ ] **Step 4: Type-check and lint**

Run: `pnpm --filter @chordcraft/client-web typecheck && pnpm eslint packages/client-web/src/features/profile packages/client-web/src/app`
Expected: exit 0.

- [ ] **Step 5: Manual run**

This needs the deployed dev API (Task 14, Step 9) and `NEXT_PUBLIC_GRAPHQL_URL` pointing at it.
Run `pnpm dev:web`, sign in, open `/en/profile` and check:

1. The form loads empty; saving with a WhatsApp channel and no phone shows "This contact
   channel needs a phone number."
2. Saving a valid profile shows "Profile saved."; reloading the page shows the saved values.
3. Adding 1–3 August with "holiday" lists it with "All my bands"; removing it empties the list.
4. `/fr/profile` shows the French labels.

Use `/browse` (gstack) to capture a screenshot for the PR if the user wants one.

- [ ] **Step 6: Commit**

```bash
git add packages/client-web
git commit -m "feat(client-web): add the musician profile page"
```

---

### Task 17: Documentation and the quality gate

**Files:**

- Modify: `documentation/PRD.md`, `documentation/HIGH_LEVEL_DESIGN.md`, `README.md`,
  `CLAUDE.md`

- [ ] **Step 1: Update the documents**

- `documentation/PRD.md` §5.4.1: FR-8.1, FR-8.2, FR-8.3 → **Shipped** if Task 16's manual run
  passed against a deployed stack, **Partial** ("built, not deployed") otherwise. FR-8.4 →
  **Partial** — "whole-day ranges for all bands; scoping to chosen bands arrives with bands
  (phase 2)". FR-8.5 → **Specified** (no bands yet to share with). §7 (Current API surface):
  add the `context-user` operations from the spec §6.2.
- `documentation/HIGH_LEVEL_DESIGN.md` §4.3: mark the `{stack}-users` table **Built** and state
  that unavailability is keyed `UNAVAIL#<ID>` with `LSI1` on `UNAVAIL#<From>#<ID>`. §3.1: note
  the `api-user` Lambda.
- `README.md` Structure: add `api-user/  # AWS Lambda API for musician profiles`, and describe
  `context-user/` as "Bounded context for User — musician profiles and unavailability".
- `CLAUDE.md` package map: add `api-user` ("AWS Lambda handler wrapping user GraphQL
  resolvers") and change `context-user` to "Bounded context for users — musician profiles and
  unavailability (state-stored)". Update the sentence below the table so it names only
  `context-band` as scaffolded.

- [ ] **Step 2: Run the full gate**

Run: `pnpm check`
Expected: format, lint (0 errors), typecheck, knip and all unit tests pass. Then
`pnpm test:integration` with `docker compose up -d`: both integration projects pass.

- [ ] **Step 3: Commit**

```bash
git add documentation README.md CLAUDE.md
git commit -m "docs: record musician profiles as built"
```
