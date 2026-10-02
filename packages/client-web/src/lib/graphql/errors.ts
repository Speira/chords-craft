import { ClientError } from 'graphql-request';

export interface GraphQLFailure {
  errorType: string;
  message: string;
}

/** AppSync puts the domain's error type on each GraphQL error (`VALIDATION`, `CONFLICT`, …). */
export function readGraphQLFailure(error: unknown): GraphQLFailure {
  if (error instanceof ClientError) {
    const first: unknown = error.response.errors?.[0];
    if (typeof first === 'object' && first !== null) {
      const errorType =
        'errorType' in first && typeof first.errorType === 'string' ? first.errorType : 'INTERNAL';
      const message = 'message' in first && typeof first.message === 'string' ? first.message : '';
      return { errorType, message };
    }
  }
  return { errorType: 'NETWORK', message: error instanceof Error ? error.message : String(error) };
}
