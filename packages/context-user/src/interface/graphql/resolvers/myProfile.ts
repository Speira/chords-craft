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
