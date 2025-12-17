import { Schema } from "effect";

export type ChartError =
  | ChartNotFound
  | ChartReadError
  | ChartValidationError
  | InvalidSection
  | InvalidRoot
  | ChartWriteError
  | InvalidPlan
  | ChartParseError;

export class ChartValidationError extends Schema.TaggedError<ChartValidationError>()(
  "ChartValidationError",
  { reason: Schema.String }
) {}

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

export class ChartReadError extends Schema.TaggedError<ChartReadError>()(
  "ChartReadError",
  { reason: Schema.Unknown }
) {}

export class ChartWriteError extends Schema.TaggedError<ChartWriteError>()(
  "ChartWriteError",
  { reason: Schema.Unknown }
) {}

export class ChartParseError extends Schema.TaggedError<ChartParseError>()(
  "ChartParseError",
  { reason: Schema.Unknown }
) {}
