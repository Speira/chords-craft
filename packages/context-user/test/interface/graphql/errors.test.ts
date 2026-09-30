import { Effect, ParseResult, Schema } from 'effect';

import { describe, expect, it, vi } from 'vitest';

import {
  ConcurrentModification,
  ProfileRuleViolation,
  UnavailabilityNotFound,
  UserReadError,
} from '#context-user/domain';
import {
  GraphQLDomainError,
  runResolver,
  toGraphQLError,
} from '#context-user/interface/graphql/errors';

describe('toGraphQLError', () => {
  it.each([
    [new ProfileRuleViolation({ rule: 'DUPLICATE_ROLE' }), 'VALIDATION', 'DUPLICATE_ROLE'],
    [new UnavailabilityNotFound({ id: 'x' }), 'NOT_FOUND', 'Unavailability x not found'],
    [new ConcurrentModification({ entity: 'MusicianProfile' }), 'CONFLICT', 'MusicianProfile'],
    [new UserReadError({ reason: new Error('secret table name') }), 'INTERNAL', 'Internal error'],
  ])('maps %o to %s', (error, errorType, message) => {
    const mapped = toGraphQLError(error);
    expect(mapped.errorType).toBe(errorType);
    expect(mapped.name).toBe(errorType);
    expect(mapped.message).toContain(message);
  });

  it('maps a parse error to VALIDATION with the path that failed', () => {
    const parseError = Effect.runSync(
      Effect.flip(Schema.decodeUnknown(Schema.Struct({ email: Schema.String }))({})),
    );
    expect(parseError).toBeInstanceOf(ParseResult.ParseError);
    const mapped = toGraphQLError(parseError);
    expect(mapped.errorType).toBe('VALIDATION');
    expect(mapped.message).toContain('email');
  });
});

describe('runResolver', () => {
  it('turns a defect into INTERNAL without leaking it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(runResolver('test', Effect.die(new Error('boom')))).rejects.toEqual(
      new GraphQLDomainError('INTERNAL', 'Internal error'),
    );
    error.mockRestore();
  });
});
