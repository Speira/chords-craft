import { Schema } from 'effect';

import { UserID } from '@chordcraft/shared/valueObjects';

import { UnavailabilityFieldsSchema } from '#context-user/domain';

export class AddUnavailabilityCommand extends Schema.Class<AddUnavailabilityCommand>(
  'AddUnavailabilityCommand',
)({
  ...UnavailabilityFieldsSchema.fields,
  userId: UserID.schema,
}) {}
