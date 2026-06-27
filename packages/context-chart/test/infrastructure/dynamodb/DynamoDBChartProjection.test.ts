import { Effect } from "effect";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ChartReadError } from "../../../src/domain/errors";
import { ChartID } from "../../../src/domain/valueObjects";
import { DynamoDBChartProjection } from "../../../src/infrastructure/dynamodb/DynamoDBChartProjection";
import {
  createProjectionTable,
  createTestClient,
  deleteTable,
  makeChart,
  PROJECTION_TABLE,
} from "./helpers";

describe("DynamoDBChartProjection", () => {
  const client = createTestClient();
  const projection = new DynamoDBChartProjection(client);

  beforeAll(async () => {
    await createProjectionTable(client);
  });

  afterAll(async () => {
    await deleteTable(client, PROJECTION_TABLE);
  });

  it("upserts a chart and retrieves it by id", async () => {
    const chart = makeChart();

    await Effect.runPromise(projection.upsert(chart));
    const found = await Effect.runPromise(projection.findById(chart.id, chart.tenantId));

    expect(found.id).toBe(chart.id);
    expect(found.title).toBe(chart.title);
    expect(found.tenantId).toBe(chart.tenantId);
  });

  it("upserts a chart and retrieves it by tenant", async () => {
    const tenantId = "tenant-findByTenant";
    const chart1 = makeChart(ChartID.generate(), tenantId);
    const chart2 = makeChart(ChartID.generate(), tenantId);

    await Effect.runPromise(
      Effect.all([projection.upsert(chart1), projection.upsert(chart2)]),
    );
    const charts = await Effect.runPromise(projection.findByTenant(tenantId));

    expect(charts).toHaveLength(2);
    const ids = charts.map((c) => c.id);
    expect(ids).toContain(chart1.id);
    expect(ids).toContain(chart2.id);
  });

  it("deletes a chart and findById returns a ChartReadError", async () => {
    const chart = makeChart();

    await Effect.runPromise(projection.upsert(chart));
    await Effect.runPromise(projection.delete(chart));

    const result = await Effect.runPromise(
      projection.findById(chart.id, chart.tenantId).pipe(Effect.either),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(ChartReadError);
    }
  });
});
