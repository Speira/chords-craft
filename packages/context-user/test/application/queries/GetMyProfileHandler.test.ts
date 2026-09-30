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
