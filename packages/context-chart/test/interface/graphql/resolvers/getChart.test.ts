import { Effect, Layer } from "effect";

import { describe, expect, it, vi } from "vitest";

import { Chord, Note, Section, TenantID } from "@speira/chordschart-shared/valueObjects";

import {
  ChartID,
  ChartProjection,
  ChartReadError,
  ChartRepository,
} from "../../../../src/domain";
import { Chart } from "../../../../src/domain/Chart";
import { getChart } from "../../../../src/interface/graphql/resolvers/getChart";

describe("getChart resolver", () => {
  const validInput = {
    chartId: "01HQ3X5Z8M9N6P7R8S9T0V1W2X",
    tenantId: "tenant-123",
  };

  describe("validation tests", () => {
    it("should reject missing required chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: undefined,
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject missing required tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: undefined,
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject empty chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "",
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject empty tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: "",
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject invalid chartId format", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "invalid-ulid-format",
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject chartId that is too short", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "SHORT",
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject chartId that is too long", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "A".repeat(27),
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject chartId with invalid characters", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "01HQ3X5Z8M9N6P7R8S9T0V!@#$",
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject tenantId that is too long", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: "A".repeat(256),
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject null chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: null,
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject null tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: null,
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject numeric chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: 12345,
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject object as chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: { id: "test" },
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should reject array as tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: ["tenant-1", "tenant-2"],
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should rethrow errors", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: "",
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });

    it("should handle missing both required fields", async () => {
      const invalidInput = {
        chartId: undefined,
        tenantId: undefined,
      };
      await expect(getChart(invalidInput)).rejects.toThrow();
    });
  });

  // The handler's own logic is covered in test/application with mocked infra.
  // Here the resolver runs against the real handler with a mocked infrastructure
  // layer, verifying delegation and error propagation.
  describe("handler delegation", () => {
    const defaultChart = Chart.create({
      root: Note.A,
      id: ChartID.generate(),
      author: "John Doe",
      tenantId: TenantID.schema.make("tenant-123"),
      title: "Test Chart",
      structure: {
        [Section.Verse]: {
          default: [Chord.create({ root: Note.A })],
        },
      },
      plan: [Section.Verse],
      links: ["https://example.com"],
      tags: ["jazz"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("returns the chart found by the projection", async () => {
      const findById = vi.fn(() => Effect.succeed(defaultChart));
      const layer = Layer.mergeAll(
        Layer.succeed(ChartRepository, { save: vi.fn(), load: vi.fn() }),
        Layer.succeed(ChartProjection, {
          findById,
          findByTenant: vi.fn(),
          upsert: vi.fn(),
          delete: vi.fn(),
        }),
      );

      await expect(getChart(validInput, layer)).resolves.toBe(defaultChart);
      expect(findById).toHaveBeenCalledWith(validInput.chartId, validInput.tenantId);
    });

    it("rethrows projection failures", async () => {
      const layer = Layer.mergeAll(
        Layer.succeed(ChartRepository, { save: vi.fn(), load: vi.fn() }),
        Layer.succeed(ChartProjection, {
          findById: vi.fn(() => Effect.fail(new ChartReadError({ reason: "boom" }))),
          findByTenant: vi.fn(),
          upsert: vi.fn(),
          delete: vi.fn(),
        }),
      );

      await expect(getChart(validInput, layer)).rejects.toThrow();
    });
  });
});
