import { Effect } from "effect";

import { type DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocument,
  PutCommand,
  type PutCommandInput,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  type ChartError,
  type ChartEvent,
  type ChartID,
  ChartReadError,
  type ChartRepository,
  ChartWriteError,
  deserializeEvent,
  serializeEvent,
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
    id: ChartID.ChartID,
    events: Array<ChartEvent>,
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
              data: serializeEvent(evt),
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

  load(id: ChartID.ChartID): Effect.Effect<Array<ChartEvent>, ChartError> {
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
          }),
        ),
      catch: (error) => new ChartReadError({ reason: error }),
    }).pipe(
      Effect.flatMap((result) => {
        const items = result.Items;
        if (!items) {
          throw new ChartReadError({ reason: "Not event found" });
        }
        return Effect.all(items.map((item) => deserializeEvent(item)));
      }),
    );
  }
}
