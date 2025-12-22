import { Effect } from "effect";

import {
  type Chord,
  type Note,
  type Section,
  TenantID,
  type TenantIDType,
} from "@speira/chordschart-shared";

import { generateChartId } from "./valueObjects/ChartID";
import { Chart } from "./Chart";
import { type ChartError, ChartValidationError } from "./ChartErrors";
import { ChartArchived, ChartCreated, type ChartEvent } from "./ChartEvents";

export class ChartAggregate {
  static create(data: {
    root: Note.Note;
    tenantId: TenantIDType;
    title: string;
    author?: string;
    sections: Record<string, ReadonlyArray<Chord>>;
    plan: ReadonlyArray<Section.Section>;
    links: ReadonlyArray<string>;
    tags: ReadonlyArray<string>;
  }): Effect.Effect<Array<ChartEvent>, ChartError> {
    return Effect.succeed([
      new ChartCreated({
        ...data,
        isActive: true,
        author: data.author ?? "",
        aggregateId: generateChartId(),
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
    const [firstEvent, ...restEvents] = events;
    if (firstEvent._tag !== "ChartCreated") {
      return Effect.fail(
        new ChartValidationError({
          reason: "First event must be an event with a full chart",
        }),
      );
    }
    const chart = new Chart({
      ...firstEvent,
      tenantId: TenantID.make(firstEvent.tenantId),
      id: firstEvent.aggregateId,
      createdAt: firstEvent.occuredAt,
      updatedAt: firstEvent.occuredAt,
    });

    const aggregatedChart = restEvents.reduce((acc, cur) => {
      switch (cur._tag) {
        case "ChartUpdated": {
          let updated = acc;
          if (cur.title !== undefined)
            updated = updated.updateTitle(cur.title, cur.occuredAt);
          if (cur.author !== undefined)
            updated = updated.updateAuthor(cur.author, cur.occuredAt);
          if (cur.plan !== undefined)
            updated = updated.updatePlan(cur.plan, cur.occuredAt);
          if (cur.sections !== undefined)
            updated = updated.updateSections(cur.sections, cur.occuredAt);
          if (cur.tags !== undefined)
            updated = updated.updateTags(cur.tags, cur.occuredAt);
          if (cur.links !== undefined)
            updated = updated.updateLinks(cur.links, cur.occuredAt);
          return updated;
        }
        case "ChartArchived":
          return acc.archiveChart(cur.occuredAt);
        default:
          return acc;
      }
    }, chart);

    return Effect.succeed(aggregatedChart);
  }
}
