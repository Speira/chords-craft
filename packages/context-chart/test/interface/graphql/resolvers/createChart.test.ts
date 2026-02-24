import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createChart } from "../../../../src/interface/graphql/resolvers/createChart";
import { type ResolverEvent } from "../../../../src/interface/graphql/resolvers/types";

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

  const createMockEvent = (input: Record<string, unknown>): ResolverEvent => ({
    arguments: input,
    identity: null,
    source: null,
    request: {
      headers: {},
      domainName: null,
    },
    prev: null,
    info: {
      selectionSetList: [],
      selectionSetGraphQL: "",
      parentTypeName: "Mutation",
      fieldName: "createChart",
      variables: {},
    },
    stash: {},
  });

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validation tests", () => {
    it("should reject invalid root note", async () => {
      const invalidInput = {
        ...validInput,
        root: "X", // Invalid note
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "CreateChart resolver handler failed",
        expect.any(Object),
      );
    });

    it("should reject empty title", async () => {
      const invalidInput = {
        ...validInput,
        title: "",
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject title that is too short", async () => {
      const invalidInput = {
        ...validInput,
        title: "A", // Less than 2 characters
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject title that is too long", async () => {
      const invalidInput = {
        ...validInput,
        title: "A".repeat(256), // More than 255 characters
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject missing required tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject missing required root", async () => {
      const invalidInput = {
        ...validInput,
        root: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject empty plan array", async () => {
      const invalidInput = {
        ...validInput,
        plan: [],
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject invalid section in plan", async () => {
      const invalidInput = {
        ...validInput,
        plan: ["InvalidSection"],
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject plan with too many items", async () => {
      const invalidInput = {
        ...validInput,
        plan: Array(201).fill("Verse"), // More than 200 items
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject too many links", async () => {
      const invalidInput = {
        ...validInput,
        links: Array(13).fill("https://example.com"), // More than 12 items
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject too many tags", async () => {
      const invalidInput = {
        ...validInput,
        tags: Array(13).fill("tag"), // More than 12 items
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
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
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject missing required structure", async () => {
      const invalidInput = {
        ...validInput,
        structure: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject missing required plan", async () => {
      const invalidInput = {
        ...validInput,
        plan: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should log errors with correct message format", async () => {
      const invalidInput = {
        ...validInput,
        root: "INVALID",
      };
      const event = createMockEvent(invalidInput);

      try {
        await createChart(event);
        expect.fail("Should have thrown an error");
      } catch {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "CreateChart resolver handler failed",
          expect.any(Object),
        );
      }
    });

    it("should rethrow errors after logging", async () => {
      const invalidInput = {
        ...validInput,
        title: "",
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });
  });
});
