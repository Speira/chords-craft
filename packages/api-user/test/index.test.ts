import { UserInterface } from '@chordcraft/context-user';
import type { AppSyncResolverEvent } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handler } from '#api-user/index';

vi.mock('@chordcraft/context-user', () => ({
  UserInterface: {
    graphql: {
      resolvers: {
        myProfile: vi.fn(() => Promise.resolve(null)),
        myUnavailability: vi.fn(() => Promise.resolve([])),
        saveMyProfile: vi.fn(() => Promise.resolve({ userId: 'user_1' })),
        addUnavailability: vi.fn(() => Promise.resolve({ id: 'u1' })),
        updateUnavailability: vi.fn(() => Promise.resolve({ id: 'u1' })),
        removeUnavailability: vi.fn(() => Promise.resolve(true)),
      },
    },
  },
}));

const { resolvers } = UserInterface.graphql;

const makeEvent = (opts: {
  fieldName?: string;
  args?: Record<string, unknown>;
  identity?: unknown;
}): AppSyncResolverEvent<Record<string, unknown>> =>
  ({
    info: { fieldName: opts.fieldName ?? 'myProfile' },
    arguments: opts.args ?? {},
    identity:
      'identity' in opts
        ? opts.identity
        : {
            resolverContext: {
              userId: 'user_1',
              tenantId: 'user_1',
              email: 'a@b.co',
              emailVerified: 'true',
            },
          },
  }) as unknown as AppSyncResolverEvent<Record<string, unknown>>;

describe('api-user handler', { concurrent: false }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a request without an identity context', async () => {
    await expect(handler(makeEvent({ identity: null }))).rejects.toThrow(
      'Unauthorized: No identity context',
    );
    expect(resolvers.myProfile).not.toHaveBeenCalled();
  });

  it('rejects a context without a user', async () => {
    await expect(handler(makeEvent({ identity: { resolverContext: {} } }))).rejects.toThrow(
      'Unauthorized: No user',
    );
  });

  it('injects the authenticated caller over any client-supplied identity', async () => {
    await handler(
      makeEvent({
        fieldName: 'saveMyProfile',
        args: { input: { name: 'Ana' }, userId: 'user_attacker', email: 'evil@x.co' },
      }),
    );

    expect(resolvers.saveMyProfile).toHaveBeenCalledWith({
      input: { name: 'Ana' },
      userId: 'user_1',
      email: 'a@b.co',
    });
  });

  it.each([
    ['unverified', { emailVerified: 'false' }],
    ['missing', {}],
  ])('passes an empty email when the verification claim is %s', async (_label, claim) => {
    await handler(
      makeEvent({
        fieldName: 'saveMyProfile',
        identity: { resolverContext: { userId: 'user_1', email: 'a@b.co', ...claim } },
      }),
    );

    expect(resolvers.saveMyProfile).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', email: '' }),
    );
  });

  it.each([
    'myProfile',
    'myUnavailability',
    'saveMyProfile',
    'addUnavailability',
    'updateUnavailability',
    'removeUnavailability',
  ] as const)('routes %s to its resolver', async (fieldName) => {
    await handler(makeEvent({ fieldName }));

    expect(resolvers[fieldName]).toHaveBeenCalledOnce();
  });

  it('rejects an unknown field', async () => {
    await expect(handler(makeEvent({ fieldName: 'dropTable' }))).rejects.toThrow(
      'Unknown field: dropTable',
    );
  });
});
