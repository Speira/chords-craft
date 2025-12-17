import { Effect } from "effect";

import {
  type Chart,
  ChartAggregate,
  type ChartError,
  ChartProjection,
  ChartRepository,
} from "~/domain";

import { type CreateChartCommand } from "./CreateChartCommand";

export class CreateChartHandler {
  static execute(
    command: CreateChartCommand
  ): Effect.Effect<Chart, ChartError, ChartRepository | ChartProjection> {
    return Effect.gen(function* () {
      const events = yield* ChartAggregate.create({
        root: command.root,
        sections: command.sections,
        plan: command.plan,
        links: command.links,
        tenantId: command.tenantId,
        title: command.title,
        tags: command.tags,
        author: command.author ?? "",
      });
      const chart = yield* ChartAggregate.fromEvents(events);

      const repository = yield* ChartRepository;
      yield* repository.save(chart.id, events);

      const projection = yield* ChartProjection;
      yield* projection.upsert(chart);

      return chart;
    });
  }
}
