import { UserInterface } from '@chordcraft/context-user';
import type { AppSyncResolverEvent } from 'aws-lambda';

interface ResolverContext {
  userId?: string;
  email?: string;
  emailVerified?: string;
}

/**
 * AppSync entry point for musician profiles. The caller is always the authenticated user: `userId`
 * and the verified `email` from the authorizer overwrite anything the client sent.
 */
export async function handler(
  event: AppSyncResolverEvent<Record<string, unknown>>,
): Promise<unknown> {
  const { fieldName } = event.info;

  if (!event.identity || !('resolverContext' in event.identity)) {
    throw new Error('Unauthorized: No identity context');
  }
  const context = event.identity.resolverContext as ResolverContext;
  if (!context.userId) {
    throw new Error('Unauthorized: No user');
  }

  // An unverified address is treated as missing: saveMyProfile then fails VALIDATION on `email`.
  const email = context.emailVerified === 'true' ? (context.email ?? '') : '';
  const input = { ...event.arguments, userId: context.userId, email };
  const { resolvers } = UserInterface.graphql;

  switch (fieldName) {
    case 'myProfile':
      return resolvers.myProfile(input);
    case 'myUnavailability':
      return resolvers.myUnavailability(input);
    case 'saveMyProfile':
      return resolvers.saveMyProfile(input);
    case 'addUnavailability':
      return resolvers.addUnavailability(input);
    case 'updateUnavailability':
      return resolvers.updateUnavailability(input);
    case 'removeUnavailability':
      return resolvers.removeUnavailability(input);
    default:
      throw new Error(`Unknown field: ${fieldName}`);
  }
}
