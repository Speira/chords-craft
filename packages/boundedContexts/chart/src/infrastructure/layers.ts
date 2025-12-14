// infrastructure/layers.ts
import { Context, Effect, Layer } from "effect";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { ChartProjection } from "~/domain/ChartProjection";
import { ChartRepository } from "~/domain/ChartRepository";

import { DynamoDBChartProjection, DynamoDBChartRepository } from "./dynamodb";

// ===== AWS Clients =====

const DynamoDBClientTag = Context.GenericTag<DynamoDBClient>("DynamoDBClient");

export const DynamoDBClientLive = Layer.succeed(
  DynamoDBClientTag,
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" })
);

// ===== Chart Services =====

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

// ===== Composed Layers =====

/**
 * All Chart-related services
 */
export const ChartServicesLive = Layer.mergeAll(
  ChartRepositoryLive,
  ChartProjectionLive
);

/**
 * All application services - add more as you grow
 */
export const AppServicesLive = Layer.mergeAll(
  ChartServicesLive
  // UserServicesLive,  // Future
  // NotificationServicesLive,  // Future
);

// ===== Test Layers =====

/**
 * Mock layers for testing
 */
export const ChartServicesTest = Layer.mergeAll(
  Layer.succeed(ChartRepository, {
    /* mock implementation */
  } as any),
  Layer.succeed(ChartProjection, {
    /* mock implementation */
  } as any)
);
