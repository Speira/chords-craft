import { Effect, Layer, pipe } from "effect";

import { describe, expect, it, vi } from "vitest";

import { Chord, Note, Section, TenantID } from "@speira/chordschart-shared/valueObjects";

import {
  ListChartHandler,
  ListChartQuery,
} from "../../../src/application/queries/ListChart";
import {
  type ChartError,
  ChartID,
  ChartProjection,
  ChartReadError,
} from "../../../src/domain";
import { Chart } from "../../../src/domain/Chart";

describe("ListChartHandler", () => {
  const date = new Date();
  const tenantId = TenantID.schema.make("tenant-test");

  const createTestChart = (id: string, title: string): Chart => {
    return Chart.create({
      root: Note.A,
      id: ChartID.schema.make(id),
      author: "Test Author",
      tenantId,
      title,
      structure: {
        [Section.Verse]: {
          default: [Chord.create({ root: Note.A }), Chord.create({ root: Note.C })],
        },
      },
      plan: [Section.Verse, Section.Verse],
      links: ["www.test.test"],
      tags: ["jazz"],
      isActive: true,
      createdAt: date,
      updatedAt: date,
    });
  };

  it("should list all charts for a tenant", async () => {
    const chart1 = createTestChart("chart-1", "Chart 1");
    const chart2 = createTestChart("chart-2", "Chart 2");
    const chart3 = createTestChart("chart-3", "Chart 3");
    const charts = [chart1, chart2, chart3];

    const mockProjection = {
      upsert: vi.fn(() => Effect.void),
      findById: vi.fn(),
      findByTenant: vi.fn(() => Effect.succeed(charts)),
      delete: vi.fn(),
    };

    const TestLayer = Layer.succeed(ChartProjection, mockProjection);

    const query = new ListChartQuery({ tenantId });

    const program = pipe(ListChartHandler.execute(query), Effect.provide(TestLayer));

    const result = await Effect.runPromise(
      program as Effect.Effect<ReadonlyArray<Chart>, ChartError, never>,
    );

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Chart 1");
    expect(result[1].title).toBe("Chart 2");
    expect(result[2].title).toBe("Chart 3");
    expect(mockProjection.findByTenant).toHaveBeenCalledOnce();
    expect(mockProjection.findByTenant).toHaveBeenCalledWith(tenantId);
  });

  it("should return empty array when no charts exist for tenant", async () => {
    const mockProjection = {
      upsert: vi.fn(() => Effect.void),
      findById: vi.fn(),
      findByTenant: vi.fn(() => Effect.succeed([])),
      delete: vi.fn(),
    };

    const TestLayer = Layer.succeed(ChartProjection, mockProjection);

    const query = new ListChartQuery({
      tenantId,
    });

    const program = pipe(ListChartHandler.execute(query), Effect.provide(TestLayer));

    const result = await Effect.runPromise(
      program as Effect.Effect<ReadonlyArray<Chart>, ChartError, never>,
    );

    expect(result).toHaveLength(0);
    expect(mockProjection.findByTenant).toHaveBeenCalledOnce();
  });

  it("should propagate error when projection fails", async () => {
    const error = new ChartReadError({ reason: "Database connection failed" });
    const mockProjection = {
      upsert: vi.fn(() => Effect.void),
      findById: vi.fn(),
      findByTenant: vi.fn(() => Effect.fail(error)),
      delete: vi.fn(),
    };

    const TestLayer = Layer.succeed(ChartProjection, mockProjection);

    const query = new ListChartQuery({
      tenantId,
    });

    const program = pipe(ListChartHandler.execute(query), Effect.provide(TestLayer));

    await expect(
      Effect.runPromise(program as Effect.Effect<Array<Chart>, ChartError, never>),
    ).rejects.toThrow();
    expect(mockProjection.findByTenant).toHaveBeenCalledOnce();
  });
});
