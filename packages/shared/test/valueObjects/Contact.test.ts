import { Either, Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { ContactChannel, CountryCode, Email, PhoneNumber } from '#shared/valueObjects';

describe('Email', () => {
  const decode = Schema.decodeUnknownEither(Email.schema);

  it('normalises case and surrounding spaces', () => {
    expect(decode('  Ana.Lopez@Example.COM ')).toEqual(Either.right('ana.lopez@example.com'));
  });

  it('rejects what is not an email address', () => {
    expect(decode('')._tag).toBe('Left');
    expect(decode('ana@')._tag).toBe('Left');
    expect(decode('ana example.com')._tag).toBe('Left');
    expect(decode(`${'a'.repeat(250)}@example.com`)._tag).toBe('Left');
  });
});

describe('PhoneNumber', () => {
  const decode = Schema.decodeUnknownEither(PhoneNumber.schema);

  it('normalises an international number to E.164', () => {
    expect(decode('+33 6 12 34 56 78')).toEqual(Either.right('+33612345678'));
    expect(decode('+447911123456')).toEqual(Either.right('+447911123456'));
  });

  it('rejects a national number without its country code', () => {
    expect(decode('0612345678')._tag).toBe('Left');
  });

  it('rejects a number of impossible length', () => {
    expect(decode('+331')._tag).toBe('Left');
  });

  it('re-decodes its own output, so stored numbers load back', () => {
    const stored = Schema.decodeUnknownSync(PhoneNumber.schema)('+33 6 12 34 56 78');
    expect(decode(stored)).toEqual(Either.right('+33612345678'));
  });
});

describe('ContactChannel', () => {
  it('requires a phone for every channel but email', () => {
    expect(ContactChannel.CHANNELS.filter((c) => ContactChannel.checkRequiresPhone(c))).toEqual([
      'WHATSAPP',
      'SMS',
      'PHONE_CALL',
    ]);
  });
});

describe('CountryCode', () => {
  const decode = Schema.decodeUnknownEither(CountryCode.schema);

  it('accepts an uppercase ISO 3166-1 alpha-2 code', () => {
    expect(decode('FR')._tag).toBe('Right');
    expect(CountryCode.ALL).toContain('FR');
  });

  it('rejects lowercase, unknown and three-letter codes', () => {
    expect(decode('fr')._tag).toBe('Left');
    expect(decode('XX')._tag).toBe('Left');
    expect(decode('FRA')._tag).toBe('Left');
  });
});
