import { Context, Effect } from "effect";
import { ChartEvent } from "./ChartEvents";
import { ChartID } from "./value-objects";
import { ChartError, ChartNotFound } from "./ChartErrors";
import { Chart } from "./Chart";

export interface ChartRepository {
  readonly save: (
    id: ChartID,
    events: ChartEvent[]
  ) => Effect.Effect<void, ChartError>;
  readonly load: (id: ChartID) => Effect.Effect<ChartEvent[], ChartNotFound>;
  readonly getOne: (id: ChartID) => Effect.Effect<Chart, ChartError>;
}

export const ChartRepository =
  Context.GenericTag<ChartRepository>("ChartRepository");
