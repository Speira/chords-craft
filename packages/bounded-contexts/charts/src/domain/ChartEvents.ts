import { Schema } from "effect";
import { ChartID, Chord, Section } from "./value-objects";

export type ChartEvent = ChartCreated;

const BaseEvent = Schema.Struct({
  aggregateId: ChartID,
  occuredAt: Schema.DateTimeUtc,
  version: Schema.Number,
});

export class ChartCreated extends Schema.TaggedClass<ChartCreated>()(
  "ChartCreated",
  {
    ...BaseEvent,
    title: Schema.NonEmptyTrimmedString,
    sections: Schema.Record({
      key: Section.schema,
      value: Schema.Array(Chord),
    }),
    plan: Schema.Array(Section.schema),
  }
) {}

export class ChartArchived extends Schema.TaggedClass<ChartArchived>()(
  "ChartArchived",
  {
    ...BaseEvent,
    archivedAt: Schema.DateTimeUtc,
  }
) {}
