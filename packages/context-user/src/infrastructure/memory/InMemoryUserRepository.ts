import { Effect, Option } from 'effect';

import { DateRange, type UserID } from '@chordcraft/shared/valueObjects';

import {
  ConcurrentModification,
  type MusicianProfile,
  type Unavailability,
  type UnavailabilityID,
  type UserRepository,
} from '#context-user/domain';

/** Same semantics as the DynamoDB adapter, including version conflicts. */
export class InMemoryUserRepository implements UserRepository {
  private readonly profiles = new Map<string, MusicianProfile>();
  private readonly entries = new Map<string, Unavailability>();
  private readonly entryKey = (userId: string, id: string) => `${userId}#${id}`;

  findProfile(userId: UserID.UserID) {
    return Effect.sync(() => Option.fromNullable(this.profiles.get(userId)));
  }

  saveProfile(profile: MusicianProfile) {
    return Effect.suspend(() => {
      const storedVersion = this.profiles.get(profile.userId)?.version ?? 0;
      if (storedVersion !== profile.version - 1) {
        return Effect.fail(new ConcurrentModification({ entity: 'MusicianProfile' }));
      }
      this.profiles.set(profile.userId, profile);
      return Effect.void;
    });
  }

  findUnavailability(userId: UserID.UserID, id: UnavailabilityID.UnavailabilityID) {
    return Effect.sync(() => Option.fromNullable(this.entries.get(this.entryKey(userId, id))));
  }

  listUnavailability(userId: UserID.UserID, range: DateRange.DateRange) {
    return Effect.sync(() =>
      [...this.entries.values()]
        .filter((entry) => entry.userId === userId && DateRange.checkOverlaps(entry.range, range))
        .toSorted((a, b) => a.range.from.localeCompare(b.range.from)),
    );
  }

  saveUnavailability(entry: Unavailability) {
    return Effect.sync(() => {
      this.entries.set(this.entryKey(entry.userId, entry.id), entry);
    });
  }

  deleteUnavailability(entry: Unavailability) {
    return Effect.sync(() => {
      this.entries.delete(this.entryKey(entry.userId, entry.id));
    });
  }
}
