import { Effect, type Layer, ParseResult, pipe, Schema } from "effect";

import { ListChartHandler, ListChartQuery } from "~/application/queries";
import { type Chart, type ChartProjection, type ChartRepository } from "~/domain";
import { ChartServicesLive } from "~/infrastructure/dynamodb";

export const listCharts = (
  input: unknown,
  layer: Layer.Layer<ChartRepository | ChartProjection> = ChartServicesLive,
): Promise<ReadonlyArray<Chart>> => {
  const program = pipe(
    Schema.decodeUnknown(ListChartQuery)(input),
    Effect.flatMap((query) => ListChartHandler.execute(query)),
    Effect.tapError((error) =>
      Effect.sync(() => {
        if (error instanceof ParseResult.ParseError) {
          // Invalid client input — a 400-class mistake, not a server fault.
          console.warn("ListChart rejected invalid input", error);
        } else {
          console.error("ListChart resolver handler failed", error);
        }
      }),
    ),
    Effect.provide(layer),
  );

  return Effect.runPromise(program);
};
