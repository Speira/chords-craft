import { Schema } from 'effect';

import { Email, UserID } from '@chordcraft/shared/valueObjects';

import { ProfileFieldsSchema } from '#context-user/domain';

/** `userId` and `email` come from the authorizer, never from the client. */
export class SaveMyProfileCommand extends Schema.Class<SaveMyProfileCommand>(
  'SaveMyProfileCommand',
)({
  ...ProfileFieldsSchema.fields,
  userId: UserID.schema,
  email: Email.schema,
}) {}
