import { Schema } from 'effect';

import { getCountries } from 'libphonenumber-js';

/**
 * ISO 3166-1 alpha-2 codes, taken from libphonenumber's metadata so the list stays maintained
 * without a second dependency. It also carries a few territories with their own dialling code (e.g.
 * `AC`), which is harmless for a region field.
 */
export const ALL: ReadonlyArray<string> = getCountries();

const KNOWN = new Set(ALL);

export const schema = Schema.String.pipe(
  Schema.filter((code) => KNOWN.has(code), {
    message: () => 'Expected an ISO 3166-1 alpha-2 country code, e.g. FR',
  }),
  Schema.brand('CountryCode'),
);
export type CountryCode = typeof schema.Type;
