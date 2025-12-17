import { Effect } from "effect";

import {
  type Chart,
  type ChartError,
  ChartProjection,
  type ChartRepository,
} from "~/domain";

import { type GetChartQuery } from "./GetChartQuery";

export class GetChartHandler {
  static execute(
    query: GetChartQuery
  ): Effect.Effect<Chart, ChartError, ChartRepository | ChartProjection> {
    return Effect.gen(function* () {
      const projection = yield* ChartProjection;
      const chart = yield* projection.findById(query.chartId, query.tenantId);
      return chart;
    });
  }
}
