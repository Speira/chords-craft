import { Effect, pipe, Schema } from "effect";

import { ListChartHandler, ListChartQuery } from "~/application/queries";
import { type Chart } from "~/domain";
import { ChartServicesLive } from "~/infrastructure/dynamodb";

import { type ResolverEvent } from "./types";

export const listCharts = async (event: ResolverEvent): Promise<ReadonlyArray<Chart>> => {
  const program = pipe(
    Schema.decodeUnknown(ListChartQuery)(event.arguments),
    Effect.flatMap((query) => ListChartHandler.execute(query)),
    Effect.provide(ChartServicesLive),
  );

  try {
    const charts = await Effect.runPromise(program);
    return charts;
  } catch (error) {
    console.error("ListChart resolver handler failed", error);
    throw error;
  }
};
