import { Effect, type Layer, ParseResult, pipe, Schema } from 'effect';

import { CreateChartCommand, CreateChartHandler } from '#context-chart/application/commands';
import { type Chart, type ChartProjection, type ChartRepository } from '#context-chart/domain';
import { ChartServicesLive } from '#context-chart/infrastructure/dynamodb';

export const createChart = (
  input: unknown,
  layer: Layer.Layer<ChartRepository | ChartProjection> = ChartServicesLive,
): Promise<Chart> => {
  const program = pipe(
    Schema.decodeUnknown(CreateChartCommand)(input),
    Effect.flatMap((command) => CreateChartHandler.execute(command)),
    Effect.tapError((error) =>
      Effect.sync(() => {
        if (error instanceof ParseResult.ParseError) {
          // Invalid client input — a 400-class mistake, not a server fault.
          console.warn('CreateChart rejected invalid input', error);
        } else {
          console.error('CreateChart resolver handler failed', error);
        }
      }),
    ),
    Effect.provide(layer),
  );

  return Effect.runPromise(program);
};
