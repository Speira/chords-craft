import { Data, Effect, Schema } from "effect";

import { ObjectUtils } from "@speira/chordschart-shared/utils";

import {
  ChartSchema,
  type ChartSchemaType,
  type ChartUpdateInputType,
  ChartUpdateSchema,
} from "./valueObjects/Chart.schema";
import { type ChartError, ChartParseError } from "./errors";

export type ChartRecord = Omit<ChartSchemaType, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Chart domain class.
 *
 * - `create`: static method for creating chart from validated/decoded data (internal use)
 * - `parse`: static method to parse and validate unknown data (external use)
 * - `update`: static method to update Chart by returning a new instance of it
 * - `fromRecord`: (deprecated) alias for parse
 * - `toRecord`: static method that convert Chart to record
 */
export class Chart extends Data.Class<ChartSchemaType> {
  private constructor(props: ChartSchemaType) {
    super(props);
  }

  static create(props: ChartSchemaType): Chart {
    return new Chart({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static update(
    chart: Chart,
    update: ChartUpdateInputType,
  ): Effect.Effect<Chart, ChartError> {
    return Effect.gen(function* () {
      const validatedUpdate = yield* Schema.decodeUnknown(ChartUpdateSchema)(update, {
        onExcessProperty: "error",
      }).pipe(Effect.mapError((reason) => new ChartParseError({ reason })));
      return Chart.create({
        id: chart.id,
        tenantId: chart.tenantId,
        root: validatedUpdate.root ?? chart.root,
        author: validatedUpdate.author ?? chart.author,
        title: validatedUpdate.title ?? chart.title,
        structure: validatedUpdate.structure ?? chart.structure,
        plan: validatedUpdate.plan ?? chart.plan,
        links: validatedUpdate.links ?? chart.links,
        tags: validatedUpdate.tags ?? chart.tags,
        isActive: validatedUpdate.isActive ?? chart.isActive,
        createdAt: chart.createdAt,
        updatedAt: validatedUpdate.updatedAt ?? new Date(),
      });
    });
  }

  static parse(data: unknown): Effect.Effect<Chart, ChartError> {
    return Effect.gen(function* () {
      const decoded = yield* Schema.decodeUnknown(ChartSchema)(data, {
        onExcessProperty: "error",
      }).pipe(Effect.mapError((reason) => new ChartParseError({ reason })));
      return new Chart(decoded);
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
}
