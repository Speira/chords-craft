import { Schema } from 'effect';

import { UserID } from '@chordcraft/shared/valueObjects';

import { UnavailabilityID } from '#context-user/domain';

export class RemoveUnavailabilityCommand extends Schema.Class<RemoveUnavailabilityCommand>(
  'RemoveUnavailabilityCommand',
)({
  userId: UserID.schema,
  id: UnavailabilityID.schema,
}) {}
