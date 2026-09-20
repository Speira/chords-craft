import { Effect } from 'effect';

import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  PutCommand,
  type PutCommandInput,
  QueryCommand,
  type QueryCommandOutput,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

import {
  type ChartError,
  type ChartEvent,
  type ChartID,
  ChartReadError,
  type ChartRepository,
  ChartWriteError,
  deserializeEvent,
  serializeEvent,
} from '#context-chart/domain';

/** Set by the CDK stack, which prefixes the table with the stack name. */
const TABLE_NAME = process.env.EVENTS_TABLE ?? 'charts_events';

export class DynamoDBChartRepository implements ChartRepository {
  private readonly tableName = TABLE_NAME;
  private readonly client: DynamoDBClient;
  private readonly withChartKey = (str: string) => `CHART#${str}`;
  private readonly withVersionKey = (num: number) => `VERSION#${num}`;

  constructor(client: DynamoDBClient) {
    this.client = DynamoDBDocument.from(client);
  }

  save(id: ChartID.ChartID, events: Array<ChartEvent>): Effect.Effect<void, ChartWriteError> {
    return Effect.tryPromise({
      try: async () => {
        const items: Array<{ Put: PutCommandInput }> = events.map((evt) => ({
          Put: {
            TableName: this.tableName,
            Item: {
              PK: this.withChartKey(id),
              SK: this.withVersionKey(evt.version),
              eventType: evt._tag,
              aggregateId: evt.aggregateId,
              tenantId: evt.tenantId,
              version: evt.version,
              occuredAt: evt.occuredAt.toISOString(),
              createdAt: new Date().toISOString(),
              data: serializeEvent(evt),
            },
          },
        }));
        if (items.length === 1) {
          await this.client.send(new PutCommand(items[0].Put));
        } else {
          await this.client.send(new TransactWriteCommand({ TransactItems: items }));
        }
      },
      catch: (error) => new ChartWriteError({ reason: error }),
    });
  }

  /**
   * The full history, oldest first. A query returns at most 1MB per call, so it follows
   * `LastEvaluatedKey`: a truncated history would silently replay into the wrong state.
   */
  load(id: ChartID.ChartID): Effect.Effect<Array<ChartEvent>, ChartError> {
    return Effect.tryPromise({
      try: async () => {
        const items: Array<Record<string, unknown>> = [];
        let startKey: QueryCommandOutput['LastEvaluatedKey'];

        do {
          const page: QueryCommandOutput = await this.client.send(
            new QueryCommand({
              TableName: this.tableName,
              KeyConditionExpression: 'PK = :pk',
              ExpressionAttributeValues: {
                ':pk': this.withChartKey(id),
              },
              ScanIndexForward: true,
              ExclusiveStartKey: startKey,
            }),
          );
          for (const item of page.Items ?? []) items.push(item);
          startKey = page.LastEvaluatedKey;
        } while (startKey);

        return items;
      },
      catch: (error) => new ChartReadError({ reason: error }),
    }).pipe(Effect.flatMap((items) => Effect.all(items.map((item) => deserializeEvent(item)))));
  }
}
