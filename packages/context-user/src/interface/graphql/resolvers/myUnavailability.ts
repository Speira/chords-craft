import { Effect, type Layer, pipe, Schema } from 'effect';

import {
  ListMyUnavailabilityHandler,
  ListMyUnavailabilityQuery,
} from '#context-user/application/queries';
import type { UserRepository } from '#context-user/domain';
import { UserServicesLive } from '#context-user/infrastructure/dynamodb';
import { stripNulls, toRecord } from '#context-user/interface/graphql/args';
import { runResolver } from '#context-user/interface/graphql/errors';
import {
  toUnavailabilityView,
  type UnavailabilityView,
} from '#context-user/interface/graphql/unavailabilityMapping';

export function myUnavailability(
  input: unknown,
  layer: Layer.Layer<UserRepository> = UserServicesLive,
): Promise<ReadonlyArray<UnavailabilityView>> {
  const args = toRecord(stripNulls(input));
  const program = pipe(
    Schema.decodeUnknown(ListMyUnavailabilityQuery)({
      userId: args.userId,
      range: { from: args.from, to: args.to },
    }),
    Effect.flatMap((query) => ListMyUnavailabilityHandler.execute(query)),
    Effect.map((entries) => entries.map((entry) => toUnavailabilityView(entry))),
    Effect.provide(layer),
  );
  return runResolver('myUnavailability', program);
}
