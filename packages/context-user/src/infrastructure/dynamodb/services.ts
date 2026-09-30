import { Context, Effect, Layer } from 'effect';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { UserRepository } from '#context-user/domain/UserRepository';

import { DynamoDBUserRepository } from './DynamoDBUserRepository';

const DynamoDBClientTag = Context.GenericTag<DynamoDBClient>('DynamoDBClient');

export const DynamoDBClientLive = Layer.succeed(
  DynamoDBClientTag,
  new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-3' }),
);

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const client = yield* DynamoDBClientTag;
    return new DynamoDBUserRepository(client);
  }),
).pipe(Layer.provide(DynamoDBClientLive));

export const UserServicesLive = Layer.mergeAll(UserRepositoryLive);
