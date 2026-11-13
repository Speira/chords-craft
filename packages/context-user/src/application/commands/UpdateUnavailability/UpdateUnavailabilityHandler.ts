import { Effect, Option } from 'effect';

import {
  Unavailability,
  UnavailabilityNotFound,
  type UserError,
  UserRepository,
} from '#context-user/domain';

import type { UpdateUnavailabilityCommand } from './UpdateUnavailabilityCommand';

export class UpdateUnavailabilityHandler {
  static execute(
    command: UpdateUnavailabilityCommand,
  ): Effect.Effect<Unavailability, UserError, UserRepository> {
    return Effect.gen(function* () {
      const repository = yield* UserRepository;
      const { id, userId, ...fields } = command;
      // Looked up under the caller's id, so another user's entry reads as not found.
      const existing = yield* repository.findUnavailability(userId, id);
      if (Option.isNone(existing)) return yield* new UnavailabilityNotFound({ id });

      const entry = Unavailability.create({ id, userId, fields });
      yield* repository.saveUnavailability(entry);
      return entry;
    });
  }
}
