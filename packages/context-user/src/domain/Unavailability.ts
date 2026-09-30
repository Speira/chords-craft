import { Array as Arr, Schema } from 'effect';

import { type BandID, DateRange, type LocalDate, UserID } from '@chordcraft/shared/valueObjects';

import {
  type Scope,
  type UnavailabilityFields,
  UnavailabilityFieldsSchema,
} from './valueObjects/Unavailability.schema';
import * as UnavailabilityID from './valueObjects/UnavailabilityID';

interface CreateUnavailabilityParams {
  id: UnavailabilityID.UnavailabilityID;
  userId: UserID.UserID;
  fields: UnavailabilityFields;
}

const normalizeScope = (scope: Scope): Scope =>
  scope === 'ALL' ? scope : { bandIds: Arr.dedupe(scope.bandIds) };

/** Whole days a musician cannot play, for every band (`ALL`) or for chosen ones. */
export class Unavailability extends Schema.Class<Unavailability>('Unavailability')({
  ...UnavailabilityFieldsSchema.fields,
  id: UnavailabilityID.schema,
  userId: UserID.schema,
}) {
  static create(params: CreateUnavailabilityParams): Unavailability {
    const { fields, id, userId } = params;
    return new Unavailability({ ...fields, scope: normalizeScope(fields.scope), id, userId });
  }

  /** True when this entry blocks `date` for `bandId`. */
  checkAppliesTo(bandId: BandID.BandID, date: LocalDate.LocalDate): boolean {
    return (
      DateRange.checkContains(this.range, date) &&
      (this.scope === 'ALL' || this.scope.bandIds.includes(bandId))
    );
  }
}
