import { Effect, pipe, Schema } from "effect";

import { GetChartHandler, GetChartQuery } from "~/application/queries";
import { type Chart } from "~/domain";
import { ChartServicesLive } from "~/infrastructure/dynamodb";

import { type ResolverEvent } from "./types";

export const getChart = async (event: ResolverEvent): Promise<Chart> => {
  const program = pipe(
    Schema.decodeUnknown(GetChartQuery)(event.arguments),
    Effect.flatMap((query) => GetChartHandler.execute(query)),
    Effect.provide(ChartServicesLive),
  );

  try {
    return await Effect.runPromise(program);
  } catch (error) {
    console.error("GetChart resolver handler failed:", error);
    throw error;
  }
};
