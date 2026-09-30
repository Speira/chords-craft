import { Schema } from 'effect';

import {
  ContactChannel,
  CountryCode,
  MusicianRole,
  MusicStyle,
  PhoneNumber,
  SkillLevel,
} from '@chordcraft/shared/valueObjects';

const trimmed = (max: number) => Schema.Trim.pipe(Schema.minLength(1), Schema.maxLength(max));

/** Free text qualifying an `other` role or style, e.g. "accordion". */
const Detail = trimmed(40);

export const RoleTagSchema = Schema.Struct({
  role: MusicianRole.schema,
  detail: Schema.optionalWith(Detail, { exact: true }),
  isPrimary: Schema.Boolean,
  level: Schema.optionalWith(SkillLevel.schema, { exact: true }),
});
export type RoleTag = typeof RoleTagSchema.Type;

export const StyleTagSchema = Schema.Struct({
  style: MusicStyle.schema,
  detail: Schema.optionalWith(Detail, { exact: true }),
});
export type StyleTag = typeof StyleTagSchema.Type;

export const RegionSchema = Schema.Struct({
  country: CountryCode.schema,
  area: Schema.optionalWith(trimmed(100), { exact: true }),
});

/** What the musician edits. The email comes from Clerk and is not part of it. */
export const ProfileFieldsSchema = Schema.Struct({
  name: trimmed(100),
  phone: Schema.optionalWith(PhoneNumber.schema, { exact: true }),
  preferredChannel: ContactChannel.schema,
  region: Schema.optionalWith(RegionSchema, { exact: true }),
  roles: Schema.Array(RoleTagSchema).pipe(Schema.minItems(1), Schema.maxItems(10)),
  styles: Schema.Array(StyleTagSchema).pipe(Schema.maxItems(20)),
});
export type ProfileFields = typeof ProfileFieldsSchema.Type;
