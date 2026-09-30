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
