import { Schema } from "effect";

import {
  Note,
  Section,
  Structure,
  TenantID,
} from "@speira/chordschart-shared/valueObjects";

import * as ChartID from "./ChartID";

const ChartBaseSchema = Schema.Struct({
  author: Schema.String,
  isActive: Schema.Boolean,
  links: Schema.Array(Schema.String),
  plan: Schema.Array(Section.schema),
  root: Note.schema,
  structure: Structure.schema,
  tags: Schema.Array(Schema.String),
  title: Schema.String,
});

export const ChartSchema = Schema.Struct({
  ...ChartBaseSchema.fields,
  createdAt: Schema.DateFromSelf,
  id: ChartID.schema,
  tenantId: TenantID.schema,
  updatedAt: Schema.DateFromSelf,
});
export type ChartSchemaType = typeof ChartSchema.Type;

export const ChartUpdateSchema = Schema.partial(
  Schema.Struct({
    ...ChartBaseSchema.fields,
    updatedAt: Schema.DateFromSelf,
  }),
);
export type ChartUpdateInputType = typeof ChartUpdateSchema.Encoded;
