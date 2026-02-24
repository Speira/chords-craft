import { Effect, pipe, Schema } from "effect";

import { CreateChartCommand, CreateChartHandler } from "~/application/commands";
import { type Chart } from "~/domain";
import { ChartServicesLive } from "~/infrastructure/dynamodb";

import { type ResolverEvent } from "./types";

export const createChart = async (event: ResolverEvent): Promise<Chart> => {
  const program = pipe(
    Schema.decodeUnknown(CreateChartCommand)(event.arguments),
    Effect.flatMap((command) => CreateChartHandler.execute(command)),
    Effect.provide(ChartServicesLive),
  );
  try {
    const chart = await Effect.runPromise(program);
    return chart;
  } catch (error) {
    console.error("CreateChart resolver handler failed", error);
    throw error;
  }
};
