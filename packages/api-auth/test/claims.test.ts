import { describe, expect, it } from 'vitest';

import { readEmailClaims } from '#api-auth/claims';

describe('readEmailClaims', () => {
  it('normalises the email and reports a verified address', () => {
    expect(readEmailClaims({ email: ' Ana@Example.com ', email_verified: true })).toEqual({
      email: 'ana@example.com',
      emailVerified: 'true',
    });
  });

  it('returns an empty email when the claim is missing or null', () => {
    expect(readEmailClaims({})).toEqual({ email: '', emailVerified: 'false' });
    expect(readEmailClaims({ email: null, email_verified: null })).toEqual({
      email: '',
      emailVerified: 'false',
    });
  });

  it('fails closed: only the boolean true counts as verified', () => {
    expect(readEmailClaims({ email: 'a@b.co', email_verified: 'true' }).emailVerified).toBe(
      'false',
    );
    expect(readEmailClaims({ email: 'a@b.co' }).emailVerified).toBe('false');
  });
});
