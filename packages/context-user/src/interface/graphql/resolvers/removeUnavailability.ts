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
