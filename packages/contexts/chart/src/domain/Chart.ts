import { Data, Effect, Schema } from "effect";

import {
  Note,
  ObjectUtils,
  Section,
  Structure,
  TenantID,
} from "@speira/chordschart-shared";

import { type ChartError, ChartParseError } from "./errors";
import { ChartID } from "./valueObjects";

const ChartRecordSchema = Schema.Struct({
  id: ChartID.schema,
  tenantId: TenantID.schema,
  root: Note.schema,
  author: Schema.String,
  title: Schema.String,
  structure: Structure.schema,
  plan: Schema.Array(Section.schema),
  links: Schema.Array(Schema.String),
  tags: Schema.Array(Schema.String),
  isActive: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type ChartRecord = Omit<typeof ChartRecordSchema.Type, "id">;

export class Chart extends Data.Class<{
  readonly id: ChartID.ChartID;
  readonly tenantId: TenantID.TenantID;
  readonly root: Note.Note;
  readonly author: string;
  readonly title: string;
  readonly structure: Structure.Structure;
  readonly plan: ReadonlyArray<Section.Section>;
  readonly links: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}> {
  static parse(record: Record<string, unknown>): Effect.Effect<Chart, ChartError> {
    return Effect.gen(function* () {
      const decoded = yield* Schema.decodeUnknown(ChartRecordSchema)(record).pipe(
        Effect.mapError((reason) => new ChartParseError({ reason })),
      );
      return new Chart({
        ...decoded,
        createdAt: new Date(decoded.createdAt),
        updatedAt: new Date(decoded.updatedAt),
      });
    });
  }

  static toRecord(chart: Chart): ChartRecord {
    return {
      ...ObjectUtils.pick<Chart>(chart, [
        "author",
        "isActive",
        "links",
        "plan",
        "root",
        "structure",
        "tags",
        "tenantId",
        "title",
      ]),
      createdAt: chart.createdAt.toISOString(),
      updatedAt: chart.updatedAt.toISOString(),
    };
  }

  static update(chart: Chart, update: Partial<Chart>): Chart {
    return new Chart({
      ...chart,
      ...update,
      updatedAt: update.updatedAt ?? new Date(),
    });
  }
}
