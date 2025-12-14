import { Effect } from "effect";

import { type DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocument,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  Chart,
  type ChartError,
  type ChartID,
  type ChartProjection,
  ChartReadError,
  ChartWriteError,
} from "~/domain";

export class DynamoDBChartProjection implements ChartProjection {
  private readonly client: DynamoDBClient;
  private readonly tableName = "charts_projection";
  private readonly withTenantKey = (str: string) => `TENANT#${str}`;
  private readonly withChartKey = (str: string) => `CHART#${str}`;

  constructor(client: DynamoDBClient) {
    this.client = DynamoDBDocument.from(client);
  }

  findById(id: ChartID, tenantId: string): Effect.Effect<Chart, ChartError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new GetCommand({
            TableName: this.tableName,
            Key: {
              PK: this.withTenantKey(tenantId),
              SK: this.withChartKey(id),
            },
          })
        ),
      catch: (error) => new ChartReadError({ reason: error }),
    }).pipe(
      Effect.flatMap((result) => {
        if (!result.Item) {
          return new ChartReadError({ reason: "Chart not found (findById)" });
        }
        return Chart.fromRecord(result.Item);
      })
    );
  }

  findByTenant(
    tenantId: string
  ): Effect.Effect<ReadonlyArray<Chart>, ChartError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
              ":pk": this.withTenantKey(tenantId),
            },
          })
        ),
      catch: (error) => new ChartReadError({ reason: error }),
    }).pipe(
      Effect.flatMap((result) => {
        const items = result.Items ?? [];
        return Effect.all(items.map(Chart.fromRecord));
      })
    );
  }

  upsert(chart: Chart): Effect.Effect<void, ChartError> {
    return Effect.tryPromise({
      try: async () => {
        await this.client.send(
          new PutCommand({
            TableName: this.tableName,
            Item: {
              ...Chart.toRecord(chart),
              PK: this.withTenantKey(chart.tenantId),
              SK: this.withChartKey(chart.id),
              GSI1PK: this.withTenantKey(chart.tenantId),
              GSI1SK: `ACTIVE#${
                chart.isActive
              }#${chart.updatedAt.toISOString()}`,
            },
          })
        );
      },
      catch: (error) => new ChartWriteError({ reason: error }),
    });
  }

  delete(chart: Chart): Effect.Effect<void, ChartError> {
    return Effect.tryPromise({
      try: async () => {
        await this.client.send(
          new DeleteCommand({
            TableName: this.tableName,
            Key: {
              PK: this.withTenantKey(chart.tenantId),
              SK: this.withChartKey(chart.id),
            },
          })
        );
      },
      catch: (error) => new ChartWriteError({ reason: error }),
    });
  }
}
