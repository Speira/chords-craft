import { Effect } from 'effect';

import {
  Unavailability,
  UnavailabilityID,
  type UserError,
  UserRepository,
} from '#context-user/domain';

import type { AddUnavailabilityCommand } from './AddUnavailabilityCommand';

export class AddUnavailabilityHandler {
  static execute(
    command: AddUnavailabilityCommand,
  ): Effect.Effect<Unavailability, UserError, UserRepository> {
    return Effect.gen(function* () {
      const repository = yield* UserRepository;
      const { userId, ...fields } = command;
      const entry = Unavailability.create({ id: UnavailabilityID.generate(), userId, fields });
      yield* repository.saveUnavailability(entry);
      return entry;
    });
  }
}
