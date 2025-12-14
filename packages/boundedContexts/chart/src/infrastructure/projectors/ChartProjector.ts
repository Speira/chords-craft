import { Effect } from "effect";

import type { DynamoDBRecord } from "aws-lambda";

import { type ChartError } from "~/domain";
import { ChartAggregate } from "~/domain/ChartAggregate";
import { ChartProjection } from "~/domain/ChartProjection";
import { ChartRepository } from "~/domain/ChartRepository";

export class ChartProjector {
  static processRecord(
    record: DynamoDBRecord
  ): Effect.Effect<void, ChartError, ChartRepository | ChartProjection> {
    const isWriteMode =
      record.eventName && ["INSERT", "MODIFY"].includes(record.eventName);
    if (!isWriteMode) return Effect.void;
    const chartId = record.dynamodb?.Keys?.chartId.S;
    if (!chartId) return Effect.void;
    const program = Effect.gen(function* () {
      const repository = yield* ChartRepository;
      const projection = yield* ChartProjection;
      const events = yield* repository.load(chartId);
      const chart = yield* ChartAggregate.fromEvents(events);
      yield* projection.upsert(chart);
    });
    return program;
  }

  static processRecords(
    records: ReadonlyArray<DynamoDBRecord>
  ): Effect.Effect<void, ChartError, ChartRepository | ChartProjection> {
    return Effect.all(
      records.map((record) => ChartProjector.processRecord(record)),
      { concurrency: "unbounded" }
    ).pipe(Effect.asVoid);
  }
}
