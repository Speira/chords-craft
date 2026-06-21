import type { AppSyncResolverEvent } from "aws-lambda";

import { ChartInterface } from "@speira/chordschart-context-chart";

type ResolverContext = {
  userId: string;
  tenantId: string;
  orgId?: string;
};

export const handler = async (event: AppSyncResolverEvent<Record<string, unknown>>): Promise<unknown> => {
  const { fieldName } = event.info;

  // Type guard for Lambda authorizer identity
  if (!event.identity || !("resolverContext" in event.identity)) {
    throw new Error("Unauthorized: No identity context");
  }

  const context = event.identity.resolverContext as ResolverContext;

  if (!context.tenantId) {
    throw new Error("Unauthorized: No tenant");
  }

  const secureEvent = {
    ...event,
    arguments: {
      ...event.arguments,
      tenantId: context.tenantId,
    },
  };

  switch (fieldName) {
    case "createChart":
      return ChartInterface.graphql.resolvers.createChart(secureEvent);
    case "getChart":
      return ChartInterface.graphql.resolvers.getChart(secureEvent);
    case "listCharts":
      return ChartInterface.graphql.resolvers.listCharts(secureEvent);
    default:
      throw new Error(`Unknown field: ${fieldName}`);
  }
};
