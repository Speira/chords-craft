import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

import { Note, Section, TenantID } from "@speira/chordschart-shared/valueObjects";

import { Chart } from "../../../src/domain/Chart";
import { ChartCreated } from "../../../src/domain/events";
import { ChartID } from "../../../src/domain/valueObjects";

export const EVENTS_TABLE = "charts_events";
export const PROJECTION_TABLE = "charts_projection";

export function createTestClient(): DynamoDBClient {
  return new DynamoDBClient({
    region: "local",
    endpoint: process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
}

export async function createEventsTable(client: DynamoDBClient): Promise<void> {
  await client.send(
    new CreateTableCommand({
      TableName: EVENTS_TABLE,
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );
}

export async function createProjectionTable(client: DynamoDBClient): Promise<void> {
  await client.send(
    new CreateTableCommand({
      TableName: PROJECTION_TABLE,
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );
}

export async function deleteTable(
  client: DynamoDBClient,
  tableName: string,
): Promise<void> {
  await client.send(new DeleteTableCommand({ TableName: tableName }));
}

export function makeChartCreatedEvent(
  chartId: ChartID.ChartID,
  version = 1,
): ChartCreated {
  return new ChartCreated({
    aggregateId: chartId,
    tenantId: TenantID.schema.make("tenant-test"),
    occuredAt: new Date("2024-01-01T00:00:00.000Z"),
    version,
    author: "Test Author",
    isActive: true,
    links: [],
    plan: [Section.Verse],
    root: Note.C,
    tags: [],
    structure: { Verse: { default: [] } },
    title: "Test Chart",
  });
}

export function makeChart(chartId = ChartID.generate(), tenantId = "tenant-test"): Chart {
  return Chart.create({
    id: chartId,
    tenantId: TenantID.schema.make(tenantId),
    root: Note.C,
    author: "Test Author",
    title: "Test Chart",
    structure: { Verse: { default: [] } },
    plan: [Section.Verse],
    links: [],
    tags: [],
    isActive: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  });
}
