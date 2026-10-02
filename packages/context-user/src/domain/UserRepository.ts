import { Context, type Effect, type Option } from 'effect';

import type { DateRange, UserID } from '@chordcraft/shared/valueObjects';

import type { UserError } from './errors';
import type { MusicianProfile } from './MusicianProfile';
import type { Unavailability } from './Unavailability';
import type { UnavailabilityID } from './valueObjects';

export interface UserRepository {
  readonly findProfile: (
    userId: UserID.UserID,
  ) => Effect.Effect<Option.Option<MusicianProfile>, UserError>;

  /**
   * Writes the profile if the stored one is `profile.version - 1` (or absent, for version 1); fails
   * with `ConcurrentModification` otherwise.
   */
  readonly saveProfile: (profile: MusicianProfile) => Effect.Effect<void, UserError>;

  readonly findUnavailability: (
    userId: UserID.UserID,
    id: UnavailabilityID.UnavailabilityID,
  ) => Effect.Effect<Option.Option<Unavailability>, UserError>;

  /** The entries overlapping `range`, earliest first. */
  readonly listUnavailability: (
    userId: UserID.UserID,
    range: DateRange.DateRange,
  ) => Effect.Effect<ReadonlyArray<Unavailability>, UserError>;

  /** Creates or replaces the entry with this id (last write wins: only its owner edits it). */
  readonly saveUnavailability: (entry: Unavailability) => Effect.Effect<void, UserError>;

  readonly deleteUnavailability: (entry: Unavailability) => Effect.Effect<void, UserError>;
}

export const UserRepository = Context.GenericTag<UserRepository>('UserRepository');
