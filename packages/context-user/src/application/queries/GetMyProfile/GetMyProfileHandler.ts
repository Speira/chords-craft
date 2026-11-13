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
