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
