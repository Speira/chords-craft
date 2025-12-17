import { Effect } from "effect";

import { type Chart, type ChartError, ChartProjection } from "~/domain";

import { type ListChartQuery } from "./ListChartQuery";

export class ListChartHandler {
  static execute(
    query: ListChartQuery
  ): Effect.Effect<ReadonlyArray<Chart>, ChartError, ChartProjection> {
    return Effect.gen(function* () {
      const projection = yield* ChartProjection;
      const chartsList = yield* projection.findByTenant(query.tenantId);
      return chartsList;
    });
  }
}
