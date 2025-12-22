import { Context, type Effect } from "effect";

import type { ChartIDType } from "./valueObjects/ChartID";
import type { Chart } from "./Chart";
import type { ChartError } from "./ChartErrors";

export interface ChartProjection {
  readonly findById: (
    id: ChartIDType,
    tenantId: string,
  ) => Effect.Effect<Chart, ChartError>;

  readonly findByTenant: (
    tenantId: string,
  ) => Effect.Effect<ReadonlyArray<Chart>, ChartError>;

  readonly upsert: (chart: Chart) => Effect.Effect<void, ChartError>;

  readonly delete: (chart: Chart) => Effect.Effect<void, ChartError>;
}

export const ChartProjection = Context.GenericTag<ChartProjection>("ChartProjection");
