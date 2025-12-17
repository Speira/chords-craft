import { Effect } from "effect";

import { ChartAggregate, ChartProjection, ChartRepository } from "~/domain";

import { ChartServicesLive } from "./dynamodb";

export const rebuildChartProjections = async (tenantId: string) => {
  const program = Effect.gen(function* () {
    const repository = yield* ChartRepository;
    const projection = yield* ChartProjection;

    const charts = yield* projection.findByTenant(tenantId);

    yield* Effect.all(
      charts.map((chart) =>
        Effect.gen(function* () {
          const events = yield* repository.load(chart.id);
          const rebuilt = yield* ChartAggregate.fromEvents(events);
          yield* projection.upsert(rebuilt);
        })
      ),
      { concurrency: 10 }
    );
  });

  await Effect.runPromise(program.pipe(Effect.provide(ChartServicesLive)));
};
