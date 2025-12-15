import { Effect, Layer, pipe } from "effect";

import { describe, expect, it, vi } from "vitest";

import { Chord, Note, Section, TenantID } from "@speira/chordschart-shared";

import { CreateChartCommand } from "../../../src/application/commands/CreateChart/CreateChartCommand";
import { CreateChartHandler } from "../../../src/application/commands/CreateChart/CreateChartHandler";
import { type Chart } from "../../../src/domain/Chart";
import { type ChartError } from "../../../src/domain/ChartErrors";
import { ChartProjection } from "../../../src/domain/ChartProjection";
import { ChartRepository } from "../../../src/domain/ChartRepository";

describe("CreateChartHandler", () => {
  it("should create chart and save to repository and projection", async () => {
    const mockRepository = {
      save: vi.fn(() => Effect.void),
      load: vi.fn(),
    };

    const mockProjection = {
      upsert: vi.fn(() => Effect.void),
      findById: vi.fn(),
      findByTenant: vi.fn(),
      delete: vi.fn(),
    };

    const TestLayer = Layer.merge(
      Layer.succeed(ChartRepository, mockRepository),
      Layer.succeed(ChartProjection, mockProjection)
    );

    const command = {
      root: Note.C,
      tenantId: TenantID.make("tenant-1"),
      title: "Test Chart",
      author: "John Doe",
      sections: { [Section.Verse]: [new Chord({ root: Note.C })] as const },
      plan: [Section.Verse] as const,
      links: [],
      tags: [],
    };

    const program = pipe(
      CreateChartHandler.execute(new CreateChartCommand(command)),
      Effect.provide(TestLayer)
    );

    const chart = await Effect.runPromise(
      program as Effect.Effect<Chart, ChartError, never>
    );

    expect(chart.title).toBe("Test Chart");
    expect(chart.root).toBe(Note.C);
    expect(chart.isActive).toBe(true);
    expect(mockRepository.save).toHaveBeenCalledOnce();
    expect(mockProjection.upsert).toHaveBeenCalledOnce();
  });
});
