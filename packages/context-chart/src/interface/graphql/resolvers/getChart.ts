import { Effect, type Layer, ParseResult, pipe, Schema } from "effect";

import { GetChartHandler, GetChartQuery } from "~/application/queries";
import { type Chart, type ChartProjection, type ChartRepository } from "~/domain";
import { ChartServicesLive } from "~/infrastructure/dynamodb";

export const getChart = (
  input: unknown,
  layer: Layer.Layer<ChartRepository | ChartProjection> = ChartServicesLive,
): Promise<Chart> => {
  const program = pipe(
    Schema.decodeUnknown(GetChartQuery)(input),
    Effect.flatMap((query) => GetChartHandler.execute(query)),
    Effect.tapError((error) =>
      Effect.sync(() => {
        if (error instanceof ParseResult.ParseError) {
          // Invalid client input — a 400-class mistake, not a server fault.
          console.warn("GetChart rejected invalid input", error);
        } else {
          console.error("GetChart resolver handler failed:", error);
        }
      }),
    ),
    Effect.provide(layer),
  );

  return Effect.runPromise(program);
};
