import { Effect, Layer } from "effect";

import { describe, expect, it, vi } from "vitest";

import {
  ChartProjection,
  ChartRepository,
  ChartWriteError,
} from "../../../../src/domain";
import { createChart } from "../../../../src/interface/graphql/resolvers/createChart";

describe("createChart resolver", () => {
  const validInput = {
    root: "C",
    tenantId: "tenant-123",
    title: "Test Chart",
    author: "John Doe",
    structure: {
      Verse: {
        default: ["C", "Am", "F", "G"],
      },
    },
    plan: ["Verse", "Chorus"],
    links: ["https://example.com"],
    tags: ["jazz", "pop"],
  };

  describe("validation tests", () => {
    it("should reject invalid root note", async () => {
      const invalidInput = {
        ...validInput,
        root: "X",
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject empty title", async () => {
      const invalidInput = {
        ...validInput,
        title: "",
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject title that is too short", async () => {
      const invalidInput = {
        ...validInput,
        title: "A",
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject title that is too long", async () => {
      const invalidInput = {
        ...validInput,
        title: "A".repeat(256),
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject missing required tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: undefined,
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject missing required root", async () => {
      const invalidInput = {
        ...validInput,
        root: undefined,
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject empty plan array", async () => {
      const invalidInput = {
        ...validInput,
        plan: [],
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject invalid section in plan", async () => {
      const invalidInput = {
        ...validInput,
        plan: ["InvalidSection"],
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject plan with too many items", async () => {
      const invalidInput = {
        ...validInput,
        plan: Array(201).fill("Verse"),
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject too many links", async () => {
      const invalidInput = {
        ...validInput,
        links: Array(13).fill("https://example.com"),
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject too many tags", async () => {
      const invalidInput = {
        ...validInput,
        tags: Array(13).fill("tag"),
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject invalid structure format", async () => {
      const invalidInput = {
        ...validInput,
        structure: {
          InvalidSection: {
            default: ["C"],
          },
        },
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject missing required structure", async () => {
      const invalidInput = {
        ...validInput,
        structure: undefined,
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });

    it("should reject missing required plan", async () => {
      const invalidInput = {
        ...validInput,
        plan: undefined,
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should rethrow errors", async () => {
      const invalidInput = {
        ...validInput,
        title: "",
      };
      await expect(createChart(invalidInput)).rejects.toThrow();
    });
  });

  // The handler's own logic is covered in test/application with mocked infra.
  // Here the resolver runs against the real handler with a mocked infrastructure
  // layer, verifying delegation, persistence wiring, and error propagation.
  describe("handler delegation", () => {
    it("persists the chart and returns it", async () => {
      const save = vi.fn(() => Effect.void);
      const upsert = vi.fn(() => Effect.void);
      const layer = Layer.mergeAll(
        Layer.succeed(ChartRepository, { save, load: vi.fn() }),
        Layer.succeed(ChartProjection, {
          upsert,
          findById: vi.fn(),
          findByTenant: vi.fn(),
          delete: vi.fn(),
        }),
      );

      const result = await createChart(validInput, layer);

      expect(result.title).toBe("Test Chart");
      expect(save).toHaveBeenCalledOnce();
      expect(upsert).toHaveBeenCalledOnce();
    });

    it("rethrows when persistence fails", async () => {
      const layer = Layer.mergeAll(
        Layer.succeed(ChartRepository, {
          save: vi.fn(() => Effect.fail(new ChartWriteError({ reason: "boom" }))),
          load: vi.fn(),
        }),
        Layer.succeed(ChartProjection, {
          upsert: vi.fn(() => Effect.void),
          findById: vi.fn(),
          findByTenant: vi.fn(),
          delete: vi.fn(),
        }),
      );

      await expect(createChart(validInput, layer)).rejects.toThrow();
    });
  });
});
