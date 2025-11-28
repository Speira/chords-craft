import { Effect, pipe } from "effect";
import { Chart } from "./Chart";
import { ChartError } from "./ChartErrors";
import { ChartID, Note } from "./value-objects";
import { ChartCreated, ChartEvent } from "./ChartEvents";

export class ChartAggregate {
  static create(data: {
    root: Note.Note;
    title: string;
    author: string;
  }): Effect.Effect<ChartEvent[], ChartError> {
    return pipe(
      Effect.succeed(data),
      Effect.map((validated) => [
        new ChartCreated({ ...validated, id: ChartID.make() }),
      ])
    );
  }
}
