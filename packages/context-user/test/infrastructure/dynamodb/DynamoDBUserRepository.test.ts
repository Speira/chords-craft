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
