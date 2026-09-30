import { CreateTableCommand, DeleteTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const USERS_TABLE = 'users';

export function createTestClient(): DynamoDBClient {
  return new DynamoDBClient({
    region: 'local',
    endpoint: process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000',
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });
}

/** Mirrors the CDK table: PK/SK plus the LSI1 date index. */
export async function createUsersTable(client: DynamoDBClient): Promise<void> {
  await client.send(
    new CreateTableCommand({
      TableName: USERS_TABLE,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'LSI1SK', AttributeType: 'S' },
      ],
      LocalSecondaryIndexes: [
        {
          IndexName: 'LSI1',
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'LSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }),
  );
}

export async function deleteTable(client: DynamoDBClient, tableName: string): Promise<void> {
  await client.send(new DeleteTableCommand({ TableName: tableName }));
}
