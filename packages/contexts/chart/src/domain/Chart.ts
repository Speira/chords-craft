import { Data, Effect, Schema } from "effect";

import {
  Chord,
  Note,
  Section,
  TenantID,
  type TenantIDType,
} from "@speira/chordschart-shared";

import { ChartID, type ChartIDType } from "./valueObjects/ChartID";
import { type ChartError, ChartParseError } from "./ChartErrors";

const ChartRecordSchema = Schema.Struct({
  id: ChartID,
  tenantId: TenantID,
  root: Note.schema,
  author: Schema.String,
  title: Schema.String,
  sections: Schema.Record({ key: Section.schema, value: Schema.Array(Chord) }),
  plan: Schema.Array(Section.schema),
  links: Schema.Array(Schema.String),
  tags: Schema.Array(Schema.String),
  isActive: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export class Chart extends Data.Class<{
  readonly id: ChartIDType;
  readonly tenantId: TenantIDType;
  readonly root: Note.Note;
  readonly author: string;
  readonly title: string;
  readonly sections: Partial<Record<Section.Section, ReadonlyArray<Chord>>>;
  readonly plan: ReadonlyArray<Section.Section>;
  readonly links: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}> {
  static fromRecord(record: Record<string, unknown>): Effect.Effect<Chart, ChartError> {
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

  static toRecord(chart: Chart): Partial<
    Omit<Chart, "id" | "createdAt" | "updatedAt">
  > & {
    createdAt: string;
    updatedAt: string;
  } {
    return {
      root: chart.root,
      title: chart.title,
      author: chart.author,
      plan: chart.plan,
      sections: chart.sections,
      links: chart.links,
      tags: chart.tags,
      isActive: chart.isActive,
      tenantId: chart.tenantId,
      createdAt: chart.createdAt.toISOString(),
      updatedAt: chart.updatedAt.toISOString(),
    };
  }

  updateTitle(title: string, occurredAt: Date): Chart {
    return new Chart({ ...this, title, updatedAt: occurredAt });
  }

  updateAuthor(author: string, occurredAt: Date): Chart {
    return new Chart({ ...this, author, updatedAt: occurredAt });
  }

  updatePlan(plan: ReadonlyArray<Section.Section>, occurredAt: Date): Chart {
    return new Chart({ ...this, plan, updatedAt: occurredAt });
  }

  updateSections(
    sections: Record<Section.Section, ReadonlyArray<Chord>>,
    occurredAt: Date,
  ): Chart {
    return new Chart({ ...this, sections, updatedAt: occurredAt });
  }

  updateTags(tags: ReadonlyArray<string>, occurredAt: Date): Chart {
    return new Chart({ ...this, tags, updatedAt: occurredAt });
  }

  updateLinks(links: ReadonlyArray<string>, occurredAt: Date): Chart {
    return new Chart({ ...this, links, updatedAt: occurredAt });
  }

  archiveChart(occurredAt: Date): Chart {
    return new Chart({ ...this, isActive: false, updatedAt: occurredAt });
  }
}
