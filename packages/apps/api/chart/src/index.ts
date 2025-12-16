
import { Effect } from "effect";

import type { AppSyncResolverEvent } from "aws-lambda";

import {
  ChartServicesLive,
  CreateChartCommand,
  CreateChartHandler,
  GetChartHandler,
  GetChartQuery,
  ListChartHandler,
  ListChartQuery,
} from "@speira/chordschart-contexts-chart";

export const handler = async (event: AppSyncResolverEvent<any>) => {
  const { fieldName } = event.info;
  const args = event.arguments;

  const program = (() => {
    switch (fieldName) {
      case "createChart":
        return CreateChartHandler.execute(new CreateChartCommand(args));
      
      case "getChart":
        return GetChartHandler.execute(new GetChartQuery(args));
      
      case "listCharts":
        return ListChartHandler.execute(new ListChartQuery(args));
      
      default:
        return Effect.fail(new Error(`Unknown field: ${fieldName}`));
    }
  })();

  return Effect.runPromise(
    program.pipe(Effect.provide(ChartServicesLive))
  );
};
