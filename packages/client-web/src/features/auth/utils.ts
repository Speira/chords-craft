import { Typeguards } from '@chordcraft/shared/utils';
import { enUS, frFR } from '@clerk/localizations';

export const clerkLocalesMap: Record<string, typeof enUS> = {
  fr: frFR,
  en: enUS,
};

export const CLERK_LOCALES_STR = ['en-US', 'fr-FR'] as const;

export const clerkLocalAdapter = (str: string) => {
  if (str === 'fr') return 'fr-FR';
  return 'en-US';
};

export const defaultClerkLocal = enUS;

/**
 * Flatten an unknown throw into something a console can actually show.
 *
 * Clerk errors are class instances whose fields do not survive `{ err }` in the dev overlay — the
 * log reads `{}` and the cause is lost. Returns plain data instead: the message, the HTTP status
 * when there is one, and every `{ code, message }` Clerk sent.
 */
export const describeAuthError = (err: unknown) => {
  const description: {
    message: string;
    status?: number;
    errors?: Array<{ code?: string; message?: string; longMessage?: string }>;
  } = { message: err instanceof Error ? err.message : String(err) };

  if (!Typeguards.checkIsObject(err)) return description;
  if (Typeguards.checkIsKeyof(err, 'status') && Typeguards.checkIsNumber(err.status)) {
    description.status = err.status;
  }
  if (Typeguards.checkIsKeyof(err, 'errors') && Typeguards.checkIsArray(err.errors)) {
    description.errors = err.errors.filter(Typeguards.checkIsObject).map((item) => ({
      code:
        Typeguards.checkIsKeyof(item, 'code') && Typeguards.checkIsString(item.code)
          ? item.code
          : undefined,
      message:
        Typeguards.checkIsKeyof(item, 'message') && Typeguards.checkIsString(item.message)
          ? item.message
          : undefined,
      longMessage:
        Typeguards.checkIsKeyof(item, 'longMessage') && Typeguards.checkIsString(item.longMessage)
          ? item.longMessage
          : undefined,
    }));
  }
  return description;
};

export const getClerkError = (err: unknown) => {
  if (!Typeguards.checkIsObject(err)) return '';
  if (!Typeguards.checkIsKeyof(err, 'errors')) return '';
  if (!Typeguards.checkIsArray(err.errors)) return '';
  const errorItem = err.errors[0];
  if (!Typeguards.checkIsObject(errorItem)) return '';
  if (!Typeguards.checkIsKeyof(errorItem, 'code')) return '';
  if (!Typeguards.checkIsString(errorItem.code)) return '';
  return `auth.error.${errorItem.code}`;
};

/** The second-factor strategies this app can prompt for, in the order it prefers them. */
export const SECOND_FACTOR_STRATEGIES = [
  'totp',
  'phone_code',
  'email_code',
  'backup_code',
] as const;

export type SecondFactorStrategy = (typeof SECOND_FACTOR_STRATEGIES)[number];

/**
 * Pick the second factor to prompt for out of Clerk's `supportedSecondFactors`.
 *
 * Returns `undefined` when the account only offers factors this screen cannot handle, so the caller
 * can say so instead of leaving the user stuck.
 */
export const checkIsSecondFactorStrategy = (value: unknown): value is SecondFactorStrategy =>
  Typeguards.checkIsString(value) &&
  SECOND_FACTOR_STRATEGIES.includes(value as SecondFactorStrategy);
