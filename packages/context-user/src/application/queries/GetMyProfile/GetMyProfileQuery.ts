import { Schema } from 'effect';

import { UserID } from '@chordcraft/shared/valueObjects';

export class GetMyProfileQuery extends Schema.Class<GetMyProfileQuery>('GetMyProfileQuery')({
  userId: UserID.schema,
}) {}
