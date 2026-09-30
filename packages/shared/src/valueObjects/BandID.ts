// A band id is also the band's TenantID, so its prefix tells a band tenant from a personal one.

import { Schema } from 'effect';

const PATTERN = /^band_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const schema = Schema.String.pipe(
  Schema.pattern(PATTERN, { message: () => 'Expected a band id (band_<uuid>)' }),
  Schema.brand('BandID'),
);
export type BandID = typeof schema.Type;
