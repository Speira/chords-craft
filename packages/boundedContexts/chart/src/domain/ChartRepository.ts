import { Context, type Effect } from "effect";

import type { ChartError } from "./ChartErrors";
import type { ChartEvent } from "./ChartEvents";
import { type ChartID } from "./valueObjects";

export interface ChartRepository {
  readonly save: (
    id: ChartID.ChartID,
    events: Array<ChartEvent>
  ) => Effect.Effect<void, ChartError>;

  readonly load: (
    id: ChartID.ChartID
  ) => Effect.Effect<Array<ChartEvent>, ChartError>;
}

export const ChartRepository =
  Context.GenericTag<ChartRepository>("ChartRepository");
