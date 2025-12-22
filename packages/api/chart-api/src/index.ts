import type { AppSyncResolverEvent } from "aws-lambda";

import { ChartInterface } from "@speira/chordschart-contexts-chart";

export const handler = async (event: AppSyncResolverEvent<Record<string, unknown>>) => {
  const { fieldName } = event.info;
  switch (fieldName) {
    case "createChart":
      return ChartInterface.graphql.resolvers.createChart(event);
    case "getChart":
      return ChartInterface.graphql.resolvers.getChart(event);
    case "listCharts":
      return ChartInterface.graphql.resolvers.listCharts(event);
    default:
      throw new Error(`Unknown field: ${fieldName}`);
  }
};
