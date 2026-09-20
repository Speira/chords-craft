import { Context, type Effect } from 'effect';

import type { Chart } from './Chart';
import type { ChartError } from './errors';
import type { ChartID } from './valueObjects';

export interface ChartProjection {
  readonly findById: (id: ChartID.ChartID, tenantId: string) => Effect.Effect<Chart, ChartError>;

  /** Active charts only, most recently updated first. */
  readonly findByTenant: (tenantId: string) => Effect.Effect<ReadonlyArray<Chart>, ChartError>;

  /** Every chart of the tenant, archived included. */
  readonly findAllByTenant: (tenantId: string) => Effect.Effect<ReadonlyArray<Chart>, ChartError>;

  readonly upsert: (chart: Chart) => Effect.Effect<void, ChartError>;

  readonly delete: (chart: Chart) => Effect.Effect<void, ChartError>;
}

export const ChartProjection = Context.GenericTag<ChartProjection>('ChartProjection');
