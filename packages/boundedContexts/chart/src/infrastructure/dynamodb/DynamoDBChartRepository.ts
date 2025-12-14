import { Effect, Schema } from "effect";

import { type DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocument,
  PutCommand,
  type PutCommandInput,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

import { Typeguards } from "@speira/chordschart-shared";

import {
  ChartArchived,
  ChartCreated,
  type ChartError,
  type ChartEvent,
  type ChartID,
  ChartParseError,
  ChartReadError,
  type ChartRepository,
  ChartUpdated,
  ChartWriteError,
} from "~/domain";

export class DynamoDBChartRepository implements ChartRepository {
  private readonly tableName = "charts_events";
  private readonly client: DynamoDBClient;
  private readonly withChartKey = (str: string) => `CHART#${str}`;
  private readonly withVersionKey = (num: number) => `VERSION#${num}`;

  constructor(client: DynamoDBClient) {
    this.client = DynamoDBDocument.from(client);
  }

  save(
    id: ChartID,
    events: Array<ChartEvent>
  ): Effect.Effect<void, ChartWriteError> {
    return Effect.tryPromise({
      try: async () => {
        const items: Array<{ PUT: PutCommandInput }> = events.map((evt) => ({
          PUT: {
            TableName: this.tableName,
            Item: {
              PK: this.withChartKey(id),
              SK: this.withVersionKey(evt.version),
              eventType: evt._tag,
              aggregateId: evt.aggregateId,
              occuredAdt: evt.occuredAt,
              createdAd: new Date().toISOString(),
              data: this.serializeEvent(evt),
            },
          },
        }));
        if (items.length === 1) {
          this.client.send(new PutCommand(items[0].PUT));
        } else {
          this.client.send(new TransactWriteCommand({ TransactItems: items }));
        }
      },
      catch: (error) => new ChartWriteError({ reason: error }),
    });
  }

  load(id: ChartID): Effect.Effect<Array<ChartEvent>, ChartError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
              ":pk": this.withChartKey(id),
            },
            ScanIndexForward: true,
          })
        ),
      catch: (error) => new ChartReadError({ reason: error }),
    }).pipe(
      Effect.flatMap((result) => {
        const items = result.Items;
        if (!items) {
          throw new ChartReadError({ reason: "Not event found" });
        }
        return Effect.all(items.map((item) => this.deserializeEvent(item)));
      })
    );
  }

  private deserializeEvent(
    item: Record<string, unknown>
  ): Effect.Effect<ChartEvent, ChartParseError> {
    return Effect.gen(function* () {
      const eventType = item.eventType as string;
      const baseData = {
        aggregateId: item.aggregateId,
        version: item.version,
        occuredAt:
          typeof item.occuredAt === "string"
            ? new Date(item.occuredAt)
            : new Date(),
      };
      if (!Typeguards.checkIsPlainObject(item.data)) {
        return yield* Effect.fail(
          new ChartParseError({ reason: "item data could not parse" })
        );
      }
      switch (eventType) {
        case "ChartCreated":
          return yield* Schema.decodeUnknown(ChartCreated)({
            ...baseData,
            ...item.data,
          }).pipe(
            Effect.mapError((error) => new ChartParseError({ reason: error }))
          );
        case "ChartUpdated":
          return yield* Schema.decodeUnknown(ChartUpdated)({
            ...baseData,
            ...item.data,
          }).pipe(
            Effect.mapError((error) => new ChartParseError({ reason: error }))
          );

        case "ChartArchived":
          return yield* Schema.decodeUnknown(ChartArchived)(baseData).pipe(
            Effect.mapError((error) => new ChartParseError({ reason: error }))
          );

        default:
          return yield* Effect.fail(
            new ChartParseError({ reason: `Unknown event type: ${eventType}` })
          );
      }
    });
  }

  private serializeEvent(event: ChartEvent): Record<string, unknown> {
    switch (event._tag) {
      case "ChartCreated":
        return {
          author: event.author,
          isActive: event.isActive,
          links: event.links,
          plan: event.plan,
          root: event.root,
          sections: event.sections,
          tags: event.tags,
          title: event.title,
        };
      case "ChartUpdated":
        return {
          ...(event.author !== undefined && { author: event.author }),
          ...(event.title !== undefined && { title: event.title }),
          ...(event.root !== undefined && { root: event.root }),
          ...(event.plan !== undefined && { plan: event.plan }),
          ...(event.sections !== undefined && { sections: event.sections }),
          ...(event.links !== undefined && { links: event.links }),
          ...(event.tags !== undefined && { tags: event.tags }),
        };
      default:
        return {};
    }
  }
}
