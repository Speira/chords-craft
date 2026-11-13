// The Clerk user id (`sub` claim). It is also the user's personal TenantID.

import { Schema } from 'effect';

export const schema = Schema.String.pipe(
  Schema.pattern(/^user_[A-Za-z0-9]+$/, { message: () => 'Expected a Clerk user id (user_…)' }),
  Schema.maxLength(64),
  Schema.brand('UserID'),
);
export type UserID = typeof schema.Type;
