import type { AuthContextObject } from './utils';

/**
 * Reads the custom session claims configured in the Clerk dashboard (Sessions → Customize session
 * token): `email` and `email_verified`. Clerk's default token carries neither. Anything but the
 * boolean `true` counts as unverified, so a missing template fails closed.
 */
export function readEmailClaims(
  payload: object,
): Pick<AuthContextObject, 'email' | 'emailVerified'> {
  const email =
    'email' in payload && typeof payload.email === 'string'
      ? payload.email.trim().toLowerCase()
      : '';
  const isVerified = email !== '' && 'email_verified' in payload && payload.email_verified === true;
  return { email, emailVerified: isVerified ? 'true' : 'false' };
}
