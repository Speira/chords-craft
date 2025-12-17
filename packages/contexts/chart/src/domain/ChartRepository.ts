import { Context, type Effect } from "effect";

import { type ChartIDType } from "./valueObjects/ChartID";
import type { ChartError } from "./ChartErrors";
import type { ChartEvent } from "./ChartEvents";

export interface ChartRepository {
  readonly save: (
    id: ChartIDType,
    events: Array<ChartEvent>
  ) => Effect.Effect<void, ChartError>;

  readonly load: (
    id: ChartIDType
  ) => Effect.Effect<Array<ChartEvent>, ChartError>;
}

export const ChartRepository =
  Context.GenericTag<ChartRepository>("ChartRepository");
