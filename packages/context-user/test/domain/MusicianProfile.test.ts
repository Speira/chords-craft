import { Effect, Either, Option, Schema } from 'effect';

import { Email, UserID } from '@chordcraft/shared/valueObjects';
import { describe, expect, it } from 'vitest';

import { MusicianProfile } from '#context-user/domain/MusicianProfile';
import { type ProfileFields, ProfileFieldsSchema } from '#context-user/domain/valueObjects';

const USER_ID = UserID.schema.make('user_ana');
const EMAIL = Schema.decodeUnknownSync(Email.schema)('ana@example.com');
const NOW = new Date('2026-09-30T10:00:00.000Z');

function fields(overrides: Record<string, unknown> = {}): ProfileFields {
  return Schema.decodeUnknownSync(ProfileFieldsSchema)({
    name: 'Ana Lopez',
    phone: '+33612345678',
    preferredChannel: 'WHATSAPP',
    region: { country: 'FR', area: 'Île-de-France' },
    roles: [{ role: 'bass', isPrimary: true, level: 'PROFESSIONAL' }],
    styles: [{ style: 'funk' }],
    ...overrides,
  });
}

function save(profileFields: ProfileFields, existing = Option.none<MusicianProfile>()) {
  return Effect.runSync(
    Effect.either(
      MusicianProfile.save({
        existing,
        userId: USER_ID,
        email: EMAIL,
        fields: profileFields,
        now: NOW,
      }),
    ),
  );
}

describe('MusicianProfile.save', () => {
  it('creates version 1 with the email from Clerk', () => {
    const result = save(fields());
    const profile = Either.getOrThrow(result);

    expect(profile.version).toBe(1);
    expect(profile.email).toBe('ana@example.com');
    expect(profile.createdAt).toEqual(NOW);
    expect(profile.updatedAt).toEqual(NOW);
  });

  it('bumps the version and keeps createdAt on update', () => {
    const first = Either.getOrThrow(save(fields()));
    const later = new Date('2026-10-01T10:00:00.000Z');

    const second = Effect.runSync(
      MusicianProfile.save({
        existing: Option.some(first),
        userId: USER_ID,
        email: EMAIL,
        fields: fields({ name: 'Ana L.' }),
        now: later,
      }),
    );

    expect(second.version).toBe(2);
    expect(second.name).toBe('Ana L.');
    expect(second.createdAt).toEqual(NOW);
    expect(second.updatedAt).toEqual(later);
  });

  it('requires a phone for every channel but email', () => {
    const { phone: _phone, ...withoutPhone } = fields();
    const result = save(
      Schema.decodeUnknownSync(ProfileFieldsSchema)({ ...withoutPhone, preferredChannel: 'SMS' }),
    );

    expect(result).toEqual(
      Either.left(expect.objectContaining({ rule: 'PHONE_REQUIRED_FOR_CHANNEL' })),
    );
  });

  it.each([
    [
      'DUPLICATE_ROLE',
      {
        roles: [
          { role: 'bass', isPrimary: true },
          { role: 'bass', isPrimary: false },
        ],
      },
    ],
    [
      'SINGLE_PRIMARY_ROLE',
      {
        roles: [
          { role: 'bass', isPrimary: true },
          { role: 'guitar', isPrimary: true },
        ],
      },
    ],
    ['DUPLICATE_STYLE', { styles: [{ style: 'funk' }, { style: 'funk' }] }],
    ['DETAIL_REQUIRED_FOR_OTHER', { roles: [{ role: 'other', isPrimary: true }] }],
    ['DETAIL_ONLY_FOR_OTHER', { styles: [{ style: 'jazz', detail: 'bebop' }] }],
  ])('rejects %s', (rule, overrides) => {
    expect(save(fields(overrides))).toEqual(Either.left(expect.objectContaining({ rule })));
  });

  it('allows several "other" roles with different details', () => {
    const result = save(
      fields({
        roles: [
          { role: 'other', detail: 'accordion', isPrimary: true },
          { role: 'other', detail: 'harp', isPrimary: false },
        ],
      }),
    );

    expect(Either.isRight(result)).toBe(true);
  });

  it('allows no phone when the channel is email', () => {
    const { phone: _phone, ...withoutPhone } = fields();
    const result = save(
      Schema.decodeUnknownSync(ProfileFieldsSchema)({ ...withoutPhone, preferredChannel: 'EMAIL' }),
    );

    expect(Either.isRight(result)).toBe(true);
  });
});

describe('MusicianProfile record', () => {
  it('round-trips through its encoded form, ignoring store attributes', () => {
    const profile = Either.getOrThrow(save(fields()));
    const record = {
      PK: 'USER#user_ana',
      SK: 'PROFILE',
      ...Schema.encodeSync(MusicianProfile)(profile),
    };

    expect(record.createdAt).toBe('2026-09-30T10:00:00.000Z');
    expect(Schema.decodeUnknownSync(MusicianProfile)(record)).toEqual(profile);
  });
});

describe('ProfileFieldsSchema', () => {
  it('requires between 1 and 10 roles', () => {
    const decode = Schema.decodeUnknownEither(ProfileFieldsSchema);
    expect(decode({ ...fields(), roles: [] })._tag).toBe('Left');
  });

  it('trims the name and rejects a blank one', () => {
    expect(fields({ name: '  Ana  ' }).name).toBe('Ana');
    expect(Schema.decodeUnknownEither(ProfileFieldsSchema)({ ...fields(), name: '   ' })._tag).toBe(
      'Left',
    );
  });
});
