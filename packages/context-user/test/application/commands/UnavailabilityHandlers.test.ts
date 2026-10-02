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
