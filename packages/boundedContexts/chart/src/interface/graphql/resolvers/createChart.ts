import { Effect, pipe, Schema } from "effect";

import { type AppSyncResolverEvent } from "aws-lambda";

import {
  CreateChartCommand,
  CreateChartHandler,
} from "~/application/commands/CreateChart";
import { ChartServicesLive } from "~/infrastructure/layers";

type CreateChartArgs = {
  root: string;
  tenantId: string;
  title: string;
  author?: string;
  sections: Record<string, Array<unknown>>;
  plan: Array<string>;
  links: Array<string>;
  tags: Array<string>;
};

export const handler = async (event: AppSyncResolverEvent<CreateChartArgs>) => {
  const program = pipe(
    Schema.decodeUnknown(CreateChartCommand)(event.arguments),
    Effect.flatMap((command) => CreateChartHandler.execute(command)),
    Effect.provide(ChartServicesLive)
  );
  try {
    const chart = await Effect.runPromise(program);
    return chart;
  } catch (error) {
    console.error("CreateChart resolver handler failed", error);
    throw error;
  }
};
