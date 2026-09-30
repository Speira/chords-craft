import { Schema } from 'effect';

import { DateRange, UserID } from '@chordcraft/shared/valueObjects';

export class ListMyUnavailabilityQuery extends Schema.Class<ListMyUnavailabilityQuery>(
  'ListMyUnavailabilityQuery',
)({
  userId: UserID.schema,
  range: DateRange.schema,
}) {}
