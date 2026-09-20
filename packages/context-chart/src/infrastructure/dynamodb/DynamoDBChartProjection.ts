import { Effect } from 'effect';

import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocument,
  GetCommand,
  PutCommand,
  QueryCommand,
  type QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';

import {
  Chart,
  type ChartError,
  type ChartID,
  type ChartProjection,
  ChartReadError,
  ChartWriteError,
} from '#context-chart/domain';

/** Set by the CDK stack, which prefixes the table with the stack name. */
const TABLE_NAME = process.env.PROJECTION_TABLE ?? 'charts_projection';

const ACTIVE_INDEX = 'GSI1';

export class DynamoDBChartProjection implements ChartProjection {
  private readonly client: DynamoDBClient;
  private readonly tableName = TABLE_NAME;
  private readonly withTenantKey = (str: string) => `TENANT#${str}`;
  private readonly withChartKey = (str: string) => `CHART#${str}`;

  constructor(client: DynamoDBClient) {
    this.client = DynamoDBDocument.from(client);
  }

  findById(id: ChartID.ChartID, tenantId: string): Effect.Effect<Chart, ChartError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new GetCommand({
            TableName: this.tableName,
            Key: {
              PK: this.withTenantKey(tenantId),
              SK: this.withChartKey(id),
            },
          }),
        ),
      catch: (error) => new ChartReadError({ reason: error }),
    }).pipe(
      Effect.flatMap((result) => {
        if (!result.Item) return new ChartReadError({ reason: 'Chart not found (findById)' });
        return Chart.fromRecord(result.Item);
      }),
    );
  }

  /**
   * Active charts of a tenant, most recently updated first, read from GSI1. Archived charts are
   * excluded; use {@link findAllByTenant} when the whole tenant is needed.
   */
  findByTenant(tenantId: string): Effect.Effect<ReadonlyArray<Chart>, ChartError> {
    return this.queryAll({
      TableName: this.tableName,
      IndexName: ACTIVE_INDEX,
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :active)',
      ExpressionAttributeValues: {
        ':pk': this.withTenantKey(tenantId),
        ':active': 'ACTIVE#true#',
      },
      ScanIndexForward: false,
    });
  }

  /** Every chart of a tenant, archived included. Reads the base table, so no index is involved. */
  findAllByTenant(tenantId: string): Effect.Effect<ReadonlyArray<Chart>, ChartError> {
    return this.queryAll({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': this.withTenantKey(tenantId),
      },
    });
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
              GSI1SK: `ACTIVE#${chart.isActive}#${chart.updatedAt.toISOString()}`,
            },
          }),
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
          }),
        );
      },
      catch: (error) => new ChartWriteError({ reason: error }),
    });
  }

  /**
   * A DynamoDB query returns at most 1MB per call; without following `LastEvaluatedKey` a tenant
   * silently loses every chart past that page.
   */
  private queryAll(
    input: ConstructorParameters<typeof QueryCommand>[0],
  ): Effect.Effect<ReadonlyArray<Chart>, ChartError> {
    return Effect.tryPromise({
      try: async () => {
        const items: Array<Record<string, unknown>> = [];
        let startKey: QueryCommandOutput['LastEvaluatedKey'];

        do {
          const page: QueryCommandOutput = await this.client.send(
            new QueryCommand({ ...input, ExclusiveStartKey: startKey }),
          );
          for (const item of page.Items ?? []) items.push(item);
          startKey = page.LastEvaluatedKey;
        } while (startKey);

        return items;
      },
      catch: (error) => new ChartReadError({ reason: error }),
    }).pipe(Effect.flatMap((items) => Effect.all(items.map((item) => Chart.fromRecord(item)))));
  }
}
