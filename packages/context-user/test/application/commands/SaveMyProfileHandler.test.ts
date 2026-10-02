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
