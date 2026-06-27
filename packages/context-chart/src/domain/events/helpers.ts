import { Effect, Schema } from "effect";

import { Typeguards } from "@speira/chordschart-shared/utils";

import { ChartParseError } from "../errors";

import { ChartArchived, ChartCreated, type ChartEvent, ChartUpdated } from "./ChartEvent";

export function serializeEvent(event: ChartEvent): Record<string, unknown> {
  switch (event._tag) {
    case "ChartCreated":
      return {
        author: event.author,
        isActive: event.isActive,
        links: event.links,
        plan: event.plan,
        root: event.root,
        structure: event.structure,
        tags: event.tags,
        title: event.title,
      };
    case "ChartUpdated":
      return {
        ...(event.author !== undefined && { author: event.author }),
        ...(event.title !== undefined && { title: event.title }),
        ...(event.root !== undefined && { root: event.root }),
        ...(event.plan !== undefined && { plan: event.plan }),
        ...(event.structure !== undefined && {
          structure: event.structure,
        }),
        ...(event.links !== undefined && { links: event.links }),
        ...(event.tags !== undefined && { tags: event.tags }),
      };
    default:
      return {};
  }
}

export const deserializeEvent = Effect.fn(
  (item: Record<string, unknown>): Effect.Effect<ChartEvent, ChartParseError> =>
    Effect.gen(function* () {
      const eventType = item.eventType as string;

      const baseData = {
        aggregateId: item.aggregateId,
        tenantId: item.tenantId,
        version: item.version,
        occuredAt:
          typeof item.occuredAt === "string" ? new Date(item.occuredAt) : new Date(),
      };

      if (!Typeguards.checkIsPlainObject(item.data)) {
        return yield* new ChartParseError({
          reason: "item data could not parse",
        });
      }

      const mapToChartParseError = (error: unknown) =>
        new ChartParseError({ reason: error });

      switch (eventType) {
        case "ChartCreated":
          return yield* Schema.decodeUnknown(ChartCreated)({
            ...baseData,
            ...item.data,
          }).pipe(Effect.mapError(mapToChartParseError));

        case "ChartUpdated":
          return yield* Schema.decodeUnknown(ChartUpdated)({
            ...baseData,
            ...item.data,
          }).pipe(Effect.mapError(mapToChartParseError));

        case "ChartArchived":
          return yield* Schema.decodeUnknown(ChartArchived)(baseData).pipe(
            Effect.mapError(mapToChartParseError),
          );

        default:
          return yield* new ChartParseError({
            reason: `Unknown event type: "${eventType}"`,
          });
      }
    }),
);
