import { Effect, pipe, Schema } from "effect";

import type { AppSyncResolverEvent } from "aws-lambda";

import { GetChartHandler, GetChartQuery } from "~/application/queries/GetChart";
import { ChartServicesLive } from "~/infrastructure/layers";

type GetChartArgs = {
  chartId: string;
  tenantId: string;
};

export const handler = async (event: AppSyncResolverEvent<GetChartArgs>) => {
  const program = pipe(
    Schema.decodeUnknown(GetChartQuery)(event.arguments),
    Effect.flatMap((query) => GetChartHandler.execute(query)),
    Effect.provide(ChartServicesLive)
  );

  try {
    const chart = await Effect.runPromise(program);
    return chart;
  } catch (error) {
    console.error("GetChart resolver handler failed:", error);
    throw error;
  }
};
