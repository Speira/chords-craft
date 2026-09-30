import { Effect, type Layer, pipe, Schema } from 'effect';

import {
  AddUnavailabilityCommand,
  AddUnavailabilityHandler,
} from '#context-user/application/commands';
import type { UserRepository } from '#context-user/domain';
import { UserServicesLive } from '#context-user/infrastructure/dynamodb';
import { stripNulls, toRecord } from '#context-user/interface/graphql/args';
import { runResolver } from '#context-user/interface/graphql/errors';
import {
  toUnavailabilityFields,
  toUnavailabilityView,
  type UnavailabilityView,
} from '#context-user/interface/graphql/unavailabilityMapping';

export function addUnavailability(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<UnavailabilityView> {
  const args = toRecord(stripNulls(input));
  const program = pipe(
    Schema.decodeUnknown(AddUnavailabilityCommand)({
      ...toUnavailabilityFields(toRecord(args.input)),
      userId: args.userId,
    }),
    Effect.flatMap((command) => AddUnavailabilityHandler.execute(command)),
    Effect.map((entry) => toUnavailabilityView(entry)),
    Effect.provide(layer),
  );
  return runResolver('addUnavailability', program);
}
