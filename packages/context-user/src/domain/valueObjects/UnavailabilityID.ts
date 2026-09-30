import { Schema } from 'effect';

import { isValid, ulid } from 'ulid';

export const schema = Schema.String.pipe(
  Schema.filter((value) => isValid(value), { message: () => 'Expected a valid ULID' }),
  Schema.brand('UnavailabilityID'),
);
export type UnavailabilityID = typeof schema.Type;

export const generate = () => ulid() as UnavailabilityID;
