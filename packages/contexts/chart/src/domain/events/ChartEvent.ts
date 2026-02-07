import { Schema } from "effect";

import { Note, Section, Structure } from "@speira/chordschart-shared";

import { ChartID } from "../valueObjects";

const BaseEvent = Schema.Struct({
  aggregateId: ChartID.schema,
  tenantId: Schema.String,
  occuredAt: Schema.Date,
  version: Schema.Number,
});

export class ChartCreated extends Schema.TaggedClass<ChartCreated>()("ChartCreated", {
  ...BaseEvent.fields,
  author: Schema.String,
  isActive: Schema.Boolean,
  links: Schema.Array(Schema.String),
  plan: Schema.Array(Section.schema),
  root: Note.schema,
  tags: Schema.Array(Schema.String),
  structure: Structure.schema,
  title: Schema.String,
}) {}

export class ChartUpdated extends Schema.TaggedClass<ChartUpdated>()("ChartUpdated", {
  ...BaseEvent.fields,
  author: Schema.optionalWith(Schema.String, { exact: true }),
  isActive: Schema.optionalWith(Schema.Boolean, { exact: true }),
  links: Schema.optionalWith(Schema.Array(Schema.String), { exact: true }),
  plan: Schema.optionalWith(Schema.Array(Section.schema), { exact: true }),
  root: Schema.optionalWith(Note.schema, { exact: true }),
  tags: Schema.optionalWith(Schema.Array(Schema.String), { exact: true }),
  structure: Schema.optionalWith(Structure.schema, { exact: true }),
  title: Schema.optionalWith(Schema.String, { exact: true }),
}) {}

export class ChartArchived extends Schema.TaggedClass<ChartArchived>()("ChartArchived", {
  ...BaseEvent.fields,
}) {}

export type ChartEvent = ChartCreated | ChartArchived | ChartUpdated;

export const removeBaseEventFields = (
  event: ChartEvent,
): Omit<ChartEvent, "aggregateId" | "tenantId" | "occuredAt" | "version"> => {
  const {
    aggregateId: _aggregateId,
    occuredAt: _occuredAt,
    tenantId: _tenantId,
    version: _version,
    ...rest
  } = event;
  return rest;
};
