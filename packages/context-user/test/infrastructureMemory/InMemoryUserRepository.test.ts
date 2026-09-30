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
