import { Effect, pipe, Schema } from "effect";

import type { AppSyncResolverEvent } from "aws-lambda";

import { ListChartHandler } from "~/application/queries/ListChart/ListChartHandler";
import { ListChartQuery } from "~/application/queries/ListChart/ListChartQuery";
import { ChartServicesLive } from "~/infrastructure/layers";

type ListChartArgs = {
  tenantId: string;
};

export const handler = async (event: AppSyncResolverEvent<ListChartArgs>) => {
  const program = pipe(
    Schema.decodeUnknown(ListChartQuery)(event.arguments),
    Effect.flatMap((query) => ListChartHandler.execute(query)),
    Effect.provide(ChartServicesLive)
  );

  try {
    const charts = await Effect.runPromise(program);
    return charts;
  } catch (error) {
    console.error("ListChart resolver handler failed", error);
    throw error;
  }
};
