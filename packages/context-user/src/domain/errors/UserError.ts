import { Schema } from 'effect';

export const PROFILE_RULES = [
  'PHONE_REQUIRED_FOR_CHANNEL',
  'DUPLICATE_ROLE',
  'SINGLE_PRIMARY_ROLE',
  'DUPLICATE_STYLE',
  'DETAIL_REQUIRED_FOR_OTHER',
  'DETAIL_ONLY_FOR_OTHER',
] as const;
export type ProfileRule = (typeof PROFILE_RULES)[number];

export type UserError =
  | ProfileRuleViolation
  | UnavailabilityNotFound
  | ConcurrentModification
  | UserReadError
  | UserWriteError
  | UserParseError;

/** A rule spanning several fields; single-field rules are schema errors. */
export class ProfileRuleViolation extends Schema.TaggedError<ProfileRuleViolation>()(
  'ProfileRuleViolation',
  { rule: Schema.Literal(...PROFILE_RULES) },
) {}

export class UnavailabilityNotFound extends Schema.TaggedError<UnavailabilityNotFound>()(
  'UnavailabilityNotFound',
  { id: Schema.String },
) {}

/** The stored version moved on since it was read. */
export class ConcurrentModification extends Schema.TaggedError<ConcurrentModification>()(
  'ConcurrentModification',
  { entity: Schema.String },
) {}

export class UserReadError extends Schema.TaggedError<UserReadError>()('UserReadError', {
  reason: Schema.Unknown,
}) {}

export class UserWriteError extends Schema.TaggedError<UserWriteError>()('UserWriteError', {
  reason: Schema.Unknown,
}) {}

/** A stored record that no longer decodes. */
export class UserParseError extends Schema.TaggedError<UserParseError>()('UserParseError', {
  reason: Schema.Unknown,
}) {}
