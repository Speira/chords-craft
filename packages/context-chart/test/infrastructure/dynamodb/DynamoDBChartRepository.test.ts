import { Effect } from "effect";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ChartID } from "../../../src/domain/valueObjects";
import { DynamoDBChartRepository } from "../../../src/infrastructure/dynamodb/DynamoDBChartRepository";
import {
  createEventsTable,
  createTestClient,
  deleteTable,
  EVENTS_TABLE,
  makeChartCreatedEvent,
} from "./helpers";

describe("DynamoDBChartRepository", () => {
  const client = createTestClient();
  const repository = new DynamoDBChartRepository(client);

  beforeAll(async () => {
    await createEventsTable(client);
  });

  afterAll(async () => {
    await deleteTable(client, EVENTS_TABLE);
  });

  it("saves a single event and loads it back", async () => {
    const chartId = ChartID.generate();
    const event = makeChartCreatedEvent(chartId, 1);

    await Effect.runPromise(repository.save(chartId, [event]));
    const events = await Effect.runPromise(repository.load(chartId));

    expect(events).toHaveLength(1);
    expect(events[0]._tag).toBe("ChartCreated");
    expect(events[0].aggregateId).toBe(chartId);
    expect(events[0].version).toBe(1);
    expect(events[0].title).toBe("Test Chart");
  });

  it("saves multiple events via transaction and loads them in version order", async () => {
    const chartId = ChartID.generate();
    const event1 = makeChartCreatedEvent(chartId, 1);
    const event2 = makeChartCreatedEvent(chartId, 2);

    await Effect.runPromise(repository.save(chartId, [event1, event2]));
    const events = await Effect.runPromise(repository.load(chartId));

    expect(events).toHaveLength(2);
    expect(events[0].version).toBe(1);
    expect(events[1].version).toBe(2);
  });

  it("returns empty array for a non-existent chart", async () => {
    const chartId = ChartID.generate();
    const events = await Effect.runPromise(repository.load(chartId));
    expect(events).toHaveLength(0);
  });
});
