import { Effect, Option } from 'effect';

import { UnavailabilityNotFound, type UserError, UserRepository } from '#context-user/domain';

import type { RemoveUnavailabilityCommand } from './RemoveUnavailabilityCommand';

export class RemoveUnavailabilityHandler {
  static execute(
    command: RemoveUnavailabilityCommand,
  ): Effect.Effect<true, UserError, UserRepository> {
    return Effect.gen(function* () {
      const repository = yield* UserRepository;
      const existing = yield* repository.findUnavailability(command.userId, command.id);
      if (Option.isNone(existing)) return yield* new UnavailabilityNotFound({ id: command.id });

      yield* repository.deleteUnavailability(existing.value);
      return true as const;
    });
  }
}
