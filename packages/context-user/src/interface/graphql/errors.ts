import { Cause, Effect, Exit, Option, ParseResult } from 'effect';

import type { UserError } from '#context-user/domain';

export const ERROR_TYPES = [
  'VALIDATION',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INTERNAL',
] as const;
export type ErrorType = (typeof ERROR_TYPES)[number];

type ResolverError = UserError | ParseResult.ParseError;

/** Thrown to AppSync: the Lambda error's name becomes the GraphQL `errorType`. */
export class GraphQLDomainError extends Error {
  readonly errorType: ErrorType;

  constructor(errorType: ErrorType, message: string) {
    super(message);
    this.name = errorType;
    this.errorType = errorType;
  }
}

export function toGraphQLError(error: ResolverError): GraphQLDomainError {
  if (error instanceof ParseResult.ParseError) {
    return new GraphQLDomainError('VALIDATION', ParseResult.TreeFormatter.formatErrorSync(error));
  }
  switch (error._tag) {
    case 'ProfileRuleViolation':
      return new GraphQLDomainError('VALIDATION', error.rule);
    case 'UnavailabilityNotFound':
      return new GraphQLDomainError('NOT_FOUND', `Unavailability ${error.id} not found`);
    case 'ConcurrentModification':
      return new GraphQLDomainError(
        'CONFLICT',
        `${error.entity} was changed by another request; reload and retry`,
      );
    case 'UserReadError':
    case 'UserWriteError':
    case 'UserParseError':
      return new GraphQLDomainError('INTERNAL', 'Internal error');
  }
}

function logFailure(label: string, error: ResolverError, errorType: ErrorType): void {
  if (errorType === 'INTERNAL') console.error(`${label} failed`, error);
  // Invalid client input is a 400-class mistake, not a server fault.
  else if (errorType === 'VALIDATION' || errorType === 'FORBIDDEN')
    console.warn(`${label} rejected`, error);
}

/** Runs a resolver program and throws what AppSync should show; never leaks a store error. */
export async function runResolver<A>(
  label: string,
  program: Effect.Effect<A, ResolverError>,
): Promise<A> {
  const exit = await Effect.runPromiseExit(program);
  if (Exit.isSuccess(exit)) return exit.value;

  const failure = Cause.failureOption(exit.cause);
  if (Option.isNone(failure)) {
    console.error(`${label} died`, Cause.pretty(exit.cause));
    throw new GraphQLDomainError('INTERNAL', 'Internal error');
  }
  const error = toGraphQLError(failure.value);
  logFailure(label, failure.value, error.errorType);
  throw error;
}
