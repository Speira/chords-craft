import { Schema } from "effect";

import { Chord, Note, Section, TenantID } from "@speira/chordschart-shared";

export class CreateChartCommand extends Schema.Class<CreateChartCommand>(
  "CreateChartCommand"
)({
  root: Note.schema,
  tenantId: TenantID,
  title: Schema.NonEmptyString.pipe(Schema.maxLength(255), Schema.minLength(2)),
  author: Schema.optional(Schema.NonEmptyString.pipe(Schema.maxLength(255))),
  sections: Schema.Record({
    key: Section.schema,
    value: Schema.NonEmptyArray(Chord),
  }),
  plan: Schema.NonEmptyArray(Section.schema).pipe(Schema.maxItems(50)),
  links: Schema.Array(Schema.String.pipe(Schema.maxLength(255))).pipe(
    Schema.maxItems(12)
  ),
  tags: Schema.Array(Schema.String.pipe(Schema.maxLength(255))).pipe(
    Schema.maxItems(12)
  ),
}) {}
