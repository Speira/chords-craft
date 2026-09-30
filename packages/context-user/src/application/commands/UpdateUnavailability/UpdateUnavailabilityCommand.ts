import { Schema } from 'effect';

import { UserID } from '@chordcraft/shared/valueObjects';

import { UnavailabilityFieldsSchema, UnavailabilityID } from '#context-user/domain';

export class UpdateUnavailabilityCommand extends Schema.Class<UpdateUnavailabilityCommand>(
  'UpdateUnavailabilityCommand',
)({
  ...UnavailabilityFieldsSchema.fields,
  userId: UserID.schema,
  id: UnavailabilityID.schema,
}) {}
