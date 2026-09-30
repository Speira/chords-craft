import { Effect, type Option, Schema } from 'effect';

import { ContactChannel, Email, MusicianRole, UserID } from '@chordcraft/shared/valueObjects';

import { type ProfileFields, ProfileFieldsSchema } from './valueObjects/Profile.schema';
import { type ProfileRule, ProfileRuleViolation } from './errors';

interface SaveProfileParams {
  existing: Option.Option<MusicianProfile>;
  userId: UserID.UserID;
  email: Email.Email;
  fields: ProfileFields;
  now: Date;
}

interface Tag {
  slug: string;
  detail?: string;
}

const tagKey = (tag: Tag) => `${tag.slug}#${tag.detail?.toLowerCase() ?? ''}`;

const checkHasDuplicates = (tags: ReadonlyArray<Tag>) =>
  new Set(tags.map((tag) => tagKey(tag))).size !== tags.length;

function findRuleViolation(fields: ProfileFields): ProfileRule | undefined {
  const roles = fields.roles.map((tag) => ({
    slug: tag.role,
    ...(tag.detail ? { detail: tag.detail } : {}),
  }));
  const styles = fields.styles.map((tag) => ({
    slug: tag.style,
    ...(tag.detail ? { detail: tag.detail } : {}),
  }));
  const tags = [...roles, ...styles];

  if (ContactChannel.checkRequiresPhone(fields.preferredChannel) && fields.phone === undefined) {
    return 'PHONE_REQUIRED_FOR_CHANNEL';
  }
  if (tags.some((tag) => tag.slug === MusicianRole.OTHER && tag.detail === undefined)) {
    return 'DETAIL_REQUIRED_FOR_OTHER';
  }
  if (tags.some((tag) => tag.slug !== MusicianRole.OTHER && tag.detail !== undefined)) {
    return 'DETAIL_ONLY_FOR_OTHER';
  }
  if (checkHasDuplicates(roles)) return 'DUPLICATE_ROLE';
  if (fields.roles.filter((tag) => tag.isPrimary).length > 1) return 'SINGLE_PRIMARY_ROLE';
  if (checkHasDuplicates(styles)) return 'DUPLICATE_STYLE';
  return undefined;
}

/**
 * A musician's profile. State-stored: `version` increases by one on every save and guards the write
 * (optimistic concurrency). Encoding turns the dates into ISO strings for the store.
 */
export class MusicianProfile extends Schema.Class<MusicianProfile>('MusicianProfile')({
  ...ProfileFieldsSchema.fields,
  userId: UserID.schema,
  email: Email.schema,
  version: Schema.Int.pipe(Schema.positive()),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {
  /** The first version of a profile, or the next version of `existing`. */
  static save(params: SaveProfileParams): Effect.Effect<MusicianProfile, ProfileRuleViolation> {
    const rule = findRuleViolation(params.fields);
    if (rule !== undefined) return Effect.fail(new ProfileRuleViolation({ rule }));

    const { email, existing, fields, now, userId } = params;
    const previous = existing._tag === 'Some' ? existing.value : undefined;
    return Effect.succeed(
      new MusicianProfile({
        ...fields,
        userId,
        email,
        version: (previous?.version ?? 0) + 1,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
      }),
    );
  }
}
