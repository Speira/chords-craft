import { Layer } from 'effect';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRepository } from '#context-user/domain';
import { InMemoryUserRepository } from '#context-user/infrastructure/memory';
import { resolvers } from '#context-user/interface/graphql';

const PROFILE_INPUT = {
  name: 'Ana Lopez',
  phone: '+33 6 12 34 56 78',
  preferredChannel: 'WHATSAPP',
  region: { country: 'FR', area: null },
  roles: [{ role: 'bass', detail: null, isPrimary: true, level: 'PROFESSIONAL' }],
  styles: [{ style: 'funk', detail: null }],
};

describe('context-user resolvers', { concurrent: false }, () => {
  let layer: Layer.Layer<UserRepository>;

  beforeEach(() => {
    layer = Layer.succeed(UserRepository, new InMemoryUserRepository());
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('returns null before the first save, then the saved profile', async () => {
    expect(await resolvers.myProfile({ userId: 'user_ana' }, layer)).toBeNull();

    const saved = await resolvers.saveMyProfile(
      { input: PROFILE_INPUT, userId: 'user_ana', email: 'Ana@Example.com' },
      layer,
    );

    expect(saved.version).toBe(1);
    expect(saved.phone).toBe('+33612345678');
    expect(saved.region).toEqual({ country: 'FR' });
    expect(await resolvers.myProfile({ userId: 'user_ana' }, layer)).toEqual(saved);
  });

  it('treats GraphQL nulls as absent fields', async () => {
    const saved = await resolvers.saveMyProfile(
      {
        input: { ...PROFILE_INPUT, phone: null, preferredChannel: 'EMAIL', region: null },
        userId: 'user_ana',
        email: 'ana@example.com',
      },
      layer,
    );

    expect(saved.phone).toBeUndefined();
    expect(saved.region).toBeUndefined();
  });

  it('answers VALIDATION on an empty email claim', async () => {
    await expect(
      resolvers.saveMyProfile({ input: PROFILE_INPUT, userId: 'user_ana', email: '' }, layer),
    ).rejects.toMatchObject({ errorType: 'VALIDATION', message: expect.stringContaining('email') });
  });

  it('answers VALIDATION with the rule code on a cross-field rule', async () => {
    await expect(
      resolvers.saveMyProfile(
        { input: { ...PROFILE_INPUT, phone: null }, userId: 'user_ana', email: 'ana@example.com' },
        layer,
      ),
    ).rejects.toMatchObject({ errorType: 'VALIDATION', message: 'PHONE_REQUIRED_FOR_CHANNEL' });
  });

  it('adds, lists, moves and removes unavailability', async () => {
    const added = await resolvers.addUnavailability(
      {
        input: { from: '2026-08-10', to: '2026-08-12', reason: null, bandIds: [] },
        userId: 'user_ana',
      },
      layer,
    );
    expect(added).toMatchObject({
      from: '2026-08-10',
      appliesToAllBands: true,
      bandIds: [],
      reason: null,
    });

    const moved = await resolvers.updateUnavailability(
      {
        id: added.id,
        input: { from: '2026-08-20', to: '2026-08-21', reason: 'wedding' },
        userId: 'user_ana',
      },
      layer,
    );
    expect(moved).toMatchObject({ id: added.id, from: '2026-08-20', reason: 'wedding' });

    const listed = await resolvers.myUnavailability(
      { from: '2026-08-01', to: '2026-08-31', userId: 'user_ana' },
      layer,
    );
    expect(listed.map((item) => item.id)).toEqual([added.id]);

    expect(await resolvers.removeUnavailability({ id: added.id, userId: 'user_ana' }, layer)).toBe(
      true,
    );
    expect(
      await resolvers.myUnavailability(
        { from: '2026-08-01', to: '2026-08-31', userId: 'user_ana' },
        layer,
      ),
    ).toEqual([]);
  });

  it('answers NOT_FOUND for an unknown unavailability id', async () => {
    await expect(
      resolvers.removeUnavailability(
        { id: '01J9ZZZZZZZZZZZZZZZZZZZZZZ', userId: 'user_ana' },
        layer,
      ),
    ).rejects.toMatchObject({ errorType: 'NOT_FOUND' });
  });
});
