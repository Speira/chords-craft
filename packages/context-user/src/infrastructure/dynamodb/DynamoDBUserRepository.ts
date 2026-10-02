import { Effect, Option, Schema } from 'effect';

import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocument,
  GetCommand,
  PutCommand,
  QueryCommand,
  type QueryCommandInput,
  type QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { DateRange, LocalDate, type UserID } from '@chordcraft/shared/valueObjects';

import {
  ConcurrentModification,
  MusicianProfile,
  Unavailability,
  type UnavailabilityID,
  type UserError,
  UserParseError,
  UserReadError,
  type UserRepository,
  UserWriteError,
} from '#context-user/domain';

/** Set by the CDK stack, which prefixes the table with the stack name. */
const TABLE_NAME = process.env.USERS_TABLE ?? 'users';
const BY_DATE_INDEX = 'LSI1';
const PROFILE_KEY = 'PROFILE';

const userKey = (userId: string) => `USER#${userId}`;
const unavailabilityKey = (id: string) => `UNAVAIL#${id}`;
const unavailabilityDateKey = (from: string, id: string) => `UNAVAIL#${from}#${id}`;

const checkIsConditionalFailure = (error: unknown) =>
  error instanceof Error && error.name === 'ConditionalCheckFailedException';

const decodeProfile = (item: unknown) =>
  Schema.decodeUnknown(MusicianProfile)(item).pipe(
    Effect.mapError((reason) => new UserParseError({ reason })),
  );

const decodeUnavailability = (item: unknown) =>
  Schema.decodeUnknown(Unavailability)(item).pipe(
    Effect.mapError((reason) => new UserParseError({ reason })),
  );

/**
 * `{stack}-users`. Profiles are guarded by `version` (optimistic concurrency). Unavailability is
 * keyed by id, and `LSI1` indexes it by start date for range reads.
 */
export class DynamoDBUserRepository implements UserRepository {
  private readonly client: DynamoDBDocument;
  private readonly tableName = TABLE_NAME;

  constructor(client: DynamoDBClient) {
    this.client = DynamoDBDocument.from(client);
  }

  findProfile(userId: UserID.UserID): Effect.Effect<Option.Option<MusicianProfile>, UserError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new GetCommand({
            TableName: this.tableName,
            Key: { PK: userKey(userId), SK: PROFILE_KEY },
            ConsistentRead: true,
          }),
        ),
      catch: (error) => new UserReadError({ reason: error }),
    }).pipe(
      Effect.flatMap(({ Item }) =>
        Item === undefined
          ? Effect.succeed(Option.none())
          : decodeProfile(Item).pipe(Effect.map(Option.some)),
      ),
    );
  }

  saveProfile(profile: MusicianProfile): Effect.Effect<void, UserError> {
    const isFirstVersion = profile.version === 1;
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new PutCommand({
            TableName: this.tableName,
            Item: {
              PK: userKey(profile.userId),
              SK: PROFILE_KEY,
              ...Schema.encodeSync(MusicianProfile)(profile),
            },
            ConditionExpression: isFirstVersion
              ? 'attribute_not_exists(PK)'
              : 'version = :expected',
            ...(isFirstVersion
              ? {}
              : { ExpressionAttributeValues: { ':expected': profile.version - 1 } }),
          }),
        ),
      catch: (error) =>
        checkIsConditionalFailure(error)
          ? new ConcurrentModification({ entity: 'MusicianProfile' })
          : new UserWriteError({ reason: error }),
    });
  }

  findUnavailability(
    userId: UserID.UserID,
    id: UnavailabilityID.UnavailabilityID,
  ): Effect.Effect<Option.Option<Unavailability>, UserError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new GetCommand({
            TableName: this.tableName,
            Key: { PK: userKey(userId), SK: unavailabilityKey(id) },
            ConsistentRead: true,
          }),
        ),
      catch: (error) => new UserReadError({ reason: error }),
    }).pipe(
      Effect.flatMap(({ Item }) =>
        Item === undefined
          ? Effect.succeed(Option.none())
          : decodeUnavailability(Item).pipe(Effect.map(Option.some)),
      ),
    );
  }

  /**
   * An entry overlapping `range` starts at most MAX_SPAN_DAYS - 1 days before `range.from`, so one
   * bounded LSI1 query finds every candidate; the ones that ended earlier are dropped here.
   */
  listUnavailability(
    userId: UserID.UserID,
    range: DateRange.DateRange,
  ): Effect.Effect<ReadonlyArray<Unavailability>, UserError> {
    const earliestStart = LocalDate.addDays(range.from, -(DateRange.MAX_SPAN_DAYS - 1));
    return this.queryAll({
      TableName: this.tableName,
      IndexName: BY_DATE_INDEX,
      KeyConditionExpression: 'PK = :pk AND LSI1SK BETWEEN :low AND :high',
      ExpressionAttributeValues: {
        ':pk': userKey(userId),
        ':low': `UNAVAIL#${earliestStart}`,
        ':high': `UNAVAIL#${range.to}#~`,
      },
      ConsistentRead: true,
    }).pipe(
      Effect.flatMap((items) => Effect.all(items.map((item) => decodeUnavailability(item)))),
      Effect.map((entries) =>
        entries.filter((entry) => DateRange.checkOverlaps(entry.range, range)),
      ),
    );
  }

  saveUnavailability(entry: Unavailability): Effect.Effect<void, UserError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new PutCommand({
            TableName: this.tableName,
            Item: {
              PK: userKey(entry.userId),
              SK: unavailabilityKey(entry.id),
              LSI1SK: unavailabilityDateKey(entry.range.from, entry.id),
              ...Schema.encodeSync(Unavailability)(entry),
            },
          }),
        ),
      catch: (error) => new UserWriteError({ reason: error }),
    });
  }

  deleteUnavailability(entry: Unavailability): Effect.Effect<void, UserError> {
    return Effect.tryPromise({
      try: () =>
        this.client.send(
          new DeleteCommand({
            TableName: this.tableName,
            Key: { PK: userKey(entry.userId), SK: unavailabilityKey(entry.id) },
          }),
        ),
      catch: (error) => new UserWriteError({ reason: error }),
    });
  }

  /** Follows `LastEvaluatedKey`: a query returns at most 1MB per call. */
  private queryAll(
    input: QueryCommandInput,
  ): Effect.Effect<ReadonlyArray<Record<string, unknown>>, UserError> {
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
      catch: (error) => new UserReadError({ reason: error }),
    });
  }
}
