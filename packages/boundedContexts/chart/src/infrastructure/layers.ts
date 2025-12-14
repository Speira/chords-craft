import { Context, Effect, Layer } from "effect";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { ChartProjection } from "~/domain/ChartProjection";
import { ChartRepository } from "~/domain/ChartRepository";

import { DynamoDBChartProjection, DynamoDBChartRepository } from "./dynamodb";

const DynamoDBClientTag = Context.GenericTag<DynamoDBClient>("DynamoDBClient");

export const DynamoDBClientLive = Layer.succeed(
  DynamoDBClientTag,
  new DynamoDBClient({ region: process.env.AWS_REGION || "eu-west-1" })
);

export const ChartRepositoryLive = Layer.effect(
  ChartRepository,
  Effect.gen(function* () {
    const client = yield* DynamoDBClientTag;
    return new DynamoDBChartRepository(client);
  })
).pipe(Layer.provide(DynamoDBClientLive));

export const ChartProjectionLive = Layer.effect(
  ChartProjection,
  Effect.gen(function* () {
    const client = yield* DynamoDBClientTag;
    return new DynamoDBChartProjection(client);
  })
).pipe(Layer.provide(DynamoDBClientLive));

export const ChartServicesLive = Layer.mergeAll(
  ChartRepositoryLive,
  ChartProjectionLive
);

// TODO: Add ChartServicesLiveTest
