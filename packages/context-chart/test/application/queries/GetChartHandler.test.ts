import { Effect, Layer, pipe } from "effect";

import { describe, expect, it, vi } from "vitest";

import { Chord, Note, Section, TenantID } from "@speira/chordschart-shared/valueObjects";

import {
  GetChartHandler,
  GetChartQuery,
} from "../../../src/application/queries/GetChart";
import {
  type ChartError,
  ChartID,
  ChartProjection,
  ChartReadError,
} from "../../../src/domain";
import { Chart } from "../../../src/domain/Chart";

describe("GetChartHandler", () => {
  const date = new Date();
  const chartId = ChartID.generate();
  const tenantId = TenantID.schema.make("tenant-test");

  const defaultChart = Chart.create({
    root: Note.A,
    id: chartId,
    author: "Test Author",
    tenantId,
    title: "Test title",
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

  it("should get a chart by id and tenant", async () => {
    const mockProjection = {
      upsert: vi.fn(() => Effect.void),
      findById: vi.fn(() => Effect.succeed(defaultChart)),
      findByTenant: vi.fn(),
      delete: vi.fn(),
    };

    const TestLayer = Layer.succeed(ChartProjection, mockProjection);

    const query = new GetChartQuery({
      chartId,
      tenantId,
    });

    const program = pipe(GetChartHandler.execute(query), Effect.provide(TestLayer));

    const chart = await Effect.runPromise(
      program as Effect.Effect<Chart, ChartError, never>,
    );

    expect(chart.id).toBe(chartId);
    expect(chart.tenantId).toBe(tenantId);
    expect(chart.title).toBe("Test title");
    expect(chart.author).toBe("Test Author");
    expect(chart.root).toBe(Note.A);
    expect(mockProjection.findById).toHaveBeenCalledOnce();
    expect(mockProjection.findById).toHaveBeenCalledWith(chartId, tenantId);
  });

  it("should propagate error when chart is not found", async () => {
    const error = new ChartReadError({ reason: "Chart not found" });
    const mockProjection = {
      upsert: vi.fn(() => Effect.void),
      findById: vi.fn(() => Effect.fail(error)),
      findByTenant: vi.fn(),
      delete: vi.fn(),
    };

    const TestLayer = Layer.succeed(ChartProjection, mockProjection);

    const query = new GetChartQuery({
      chartId,
      tenantId,
    });

    const program = pipe(GetChartHandler.execute(query), Effect.provide(TestLayer));

    await expect(
      Effect.runPromise(program as Effect.Effect<Chart, ChartError, never>),
    ).rejects.toThrow();
    expect(mockProjection.findById).toHaveBeenCalledOnce();
  });
});
