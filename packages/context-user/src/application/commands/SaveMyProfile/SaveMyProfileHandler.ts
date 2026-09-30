import { Effect } from 'effect';

import { MusicianProfile, type UserError, UserRepository } from '#context-user/domain';

import type { SaveMyProfileCommand } from './SaveMyProfileCommand';

export class SaveMyProfileHandler {
  static execute(
    command: SaveMyProfileCommand,
  ): Effect.Effect<MusicianProfile, UserError, UserRepository> {
    return Effect.gen(function* () {
      const repository = yield* UserRepository;
      const existing = yield* repository.findProfile(command.userId);
      const { email, userId, ...fields } = command;

      const profile = yield* MusicianProfile.save({
        existing,
        userId,
        email,
        fields,
        now: new Date(),
      });
      yield* repository.saveProfile(profile);
      return profile;
    });
  }
}
