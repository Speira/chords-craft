import { Schema } from "effect";

import {
  Note,
  Section,
  Structure,
  TenantID,
} from "@speira/chordschart-shared/valueObjects";

export class CreateChartCommand extends Schema.Class<CreateChartCommand>(
  "CreateChartCommand",
)({
  root: Note.transform,
  tenantId: TenantID.schema,
  title: Schema.NonEmptyString.pipe(Schema.maxLength(255), Schema.minLength(2)),
  author: Schema.optional(Schema.NonEmptyString.pipe(Schema.maxLength(255))),
  structure: Structure.schema,
  plan: Schema.NonEmptyArray(Section.transform).pipe(Schema.maxItems(200)),
  links: Schema.Array(Schema.String.pipe(Schema.maxLength(255))).pipe(
    Schema.maxItems(12),
  ),
  tags: Schema.Array(Schema.String.pipe(Schema.maxLength(255))).pipe(Schema.maxItems(12)),
}) {}
