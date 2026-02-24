import { Effect } from "effect";

import {
  type Note,
  type Section,
  type Structure,
  TenantID,
} from "@speira/chordschart-shared/valueObjects";

import { Chart } from "./Chart";
import { type ChartError, ChartValidationError } from "./errors";
import {
  ChartArchived,
  ChartCreated,
  type ChartEvent,
  removeBaseEventFields,
} from "./events";
import { ChartID } from "./valueObjects";

export class ChartAggregate {
  static create(data: {
    root: Note.Note;
    tenantId: TenantID.TenantID;
    title: string;
    author?: string;
    structure: Structure.Structure;
    plan: ReadonlyArray<Section.Section>;
    links: ReadonlyArray<string>;
    tags: ReadonlyArray<string>;
  }): Effect.Effect<Array<ChartEvent>, ChartError> {
    return Effect.succeed([
      new ChartCreated({
        ...data,
        isActive: true,
        author: data.author ?? "",
        aggregateId: ChartID.generate(),
        occuredAt: new Date(),
        version: 1,
      }),
    ]);
  }

  static archive(chart: Chart): Effect.Effect<Array<ChartEvent>, ChartError> {
    if (!chart.isActive) {
      return Effect.fail(
        new ChartValidationError({ reason: "Chart is already archived" }),
      );
    }
    return Effect.succeed([
      new ChartArchived({
        tenantId: chart.tenantId,
        aggregateId: chart.id,
        occuredAt: new Date(),
        version: 2,
      }),
    ]);
  }

  static fromEvents(events: Array<ChartEvent>): Effect.Effect<Chart, ChartError> {
    return Effect.gen(function* () {
      const [firstEvent, ...restEvents] = events;
      if (firstEvent._tag !== "ChartCreated") {
        return yield* new ChartValidationError({
          reason: "First event must be an event with a full chart",
        });
      }
      const chart = Chart.create({
        ...firstEvent,
        tenantId: TenantID.schema.make(firstEvent.tenantId),
        id: firstEvent.aggregateId,
        createdAt: firstEvent.occuredAt,
        updatedAt: firstEvent.occuredAt,
        author: firstEvent.author,
      });

      let aggregatedChart = chart;
      for (const cur of restEvents) {
        switch (cur._tag) {
          case "ChartUpdated": {
            aggregatedChart = yield* Chart.update(aggregatedChart, {
              ...removeBaseEventFields(cur),
              updatedAt: cur.occuredAt,
            });
            break;
          }
          case "ChartArchived":
            aggregatedChart = yield* Chart.update(aggregatedChart, {
              isActive: false,
              updatedAt: cur.occuredAt,
            });
            break;
          default:
            break;
        }
      }

      return aggregatedChart;
    });
  }
}
