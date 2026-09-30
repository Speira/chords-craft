import { Schema } from 'effect';

import { BandID, DateRange } from '@chordcraft/shared/valueObjects';

/** `ALL` blocks every band; a band list blocks only those bands. */
export const ScopeSchema = Schema.Union(
  Schema.Literal('ALL'),
  Schema.Struct({ bandIds: Schema.NonEmptyArray(BandID.schema).pipe(Schema.maxItems(50)) }),
);
export type Scope = typeof ScopeSchema.Type;

export const UnavailabilityFieldsSchema = Schema.Struct({
  range: DateRange.schema,
  reason: Schema.optionalWith(Schema.Trim.pipe(Schema.minLength(1), Schema.maxLength(100)), {
    exact: true,
  }),
  scope: ScopeSchema,
});
export type UnavailabilityFields = typeof UnavailabilityFieldsSchema.Type;
