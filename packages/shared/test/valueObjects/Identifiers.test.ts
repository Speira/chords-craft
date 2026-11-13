import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { BandID, UserID } from '#shared/valueObjects';

describe('UserID', () => {
  const decode = Schema.decodeUnknownEither(UserID.schema);

  it('accepts a Clerk user id', () => {
    expect(decode('user_2abcDEF123')._tag).toBe('Right');
  });

  it('rejects anything that is not a Clerk user id', () => {
    expect(decode('band_0f6c2c3e-1d4b-4c9a-9a0e-2b7c1d9e8f00')._tag).toBe('Left');
    expect(decode('user_')._tag).toBe('Left');
    expect(decode('user_abc def')._tag).toBe('Left');
    expect(decode(`user_${'a'.repeat(80)}`)._tag).toBe('Left');
  });
});

describe('BandID', () => {
  const decode = Schema.decodeUnknownEither(BandID.schema);

  it('accepts band_<uuid>', () => {
    expect(decode('band_0f6c2c3e-1d4b-4c9a-9a0e-2b7c1d9e8f00')._tag).toBe('Right');
  });

  it('rejects a user id, an uppercase uuid or a bare uuid', () => {
    expect(decode('user_123')._tag).toBe('Left');
    expect(decode('band_0F6C2C3E-1D4B-4C9A-9A0E-2B7C1D9E8F00')._tag).toBe('Left');
    expect(decode('0f6c2c3e-1d4b-4c9a-9a0e-2b7c1d9e8f00')._tag).toBe('Left');
  });
});
