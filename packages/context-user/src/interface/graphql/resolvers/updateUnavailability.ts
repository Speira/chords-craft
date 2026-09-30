import { Effect, type Layer, pipe, Schema } from 'effect';

import {
  UpdateUnavailabilityCommand,
  UpdateUnavailabilityHandler,
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

export function updateUnavailability(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<UnavailabilityView> {
  const args = toRecord(stripNulls(input));
  const program = pipe(
    Schema.decodeUnknown(UpdateUnavailabilityCommand)({
      ...toUnavailabilityFields(toRecord(args.input)),
      id: args.id,
      userId: args.userId,
    }),
    Effect.flatMap((command) => UpdateUnavailabilityHandler.execute(command)),
    Effect.map((entry) => toUnavailabilityView(entry)),
    Effect.provide(layer),
  );
  return runResolver('updateUnavailability', program);
}
