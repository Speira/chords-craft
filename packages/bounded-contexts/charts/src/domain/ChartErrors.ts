import { Schema } from "effect";

export type ChartError =
  | ChartNotFound
  | InvalidSection
  | InvalidRoot
  | InvalidPlan;

export class ChartNotFound extends Schema.TaggedError<ChartNotFound>()(
  "ChartNotFound",
  { id: Schema.Number }
) {}

export class InvalidSection extends Schema.TaggedError<InvalidSection>()(
  "InvalidSection",
  { id: Schema.Number }
) {}

export class InvalidRoot extends Schema.TaggedError<InvalidRoot>()(
  "InvalidRoot",
  { id: Schema.Number }
) {}

export class InvalidPlan extends Schema.TaggedError<InvalidPlan>()(
  "InvalidPlan",
  { id: Schema.Number }
) {}
