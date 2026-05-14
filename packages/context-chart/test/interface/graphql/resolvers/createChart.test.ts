import { describe, expect, it } from "vitest";

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

  describe("validation tests", () => {
    it("should reject invalid root note", async () => {
      const invalidInput = {
        ...validInput,
        root: "X",
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject empty title", async () => {
      const invalidInput = {
        ...validInput,
        title: "",
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject title that is too short", async () => {
      const invalidInput = {
        ...validInput,
        title: "A",
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject title that is too long", async () => {
      const invalidInput = {
        ...validInput,
        title: "A".repeat(256),
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject missing required tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject missing required root", async () => {
      const invalidInput = {
        ...validInput,
        root: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject empty plan array", async () => {
      const invalidInput = {
        ...validInput,
        plan: [],
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject invalid section in plan", async () => {
      const invalidInput = {
        ...validInput,
        plan: ["InvalidSection"],
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject plan with too many items", async () => {
      const invalidInput = {
        ...validInput,
        plan: Array(201).fill("Verse"),
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject too many links", async () => {
      const invalidInput = {
        ...validInput,
        links: Array(13).fill("https://example.com"),
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject too many tags", async () => {
      const invalidInput = {
        ...validInput,
        tags: Array(13).fill("tag"),
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
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
    });

    it("should reject missing required structure", async () => {
      const invalidInput = {
        ...validInput,
        structure: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });

    it("should reject missing required plan", async () => {
      const invalidInput = {
        ...validInput,
        plan: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should rethrow errors", async () => {
      const invalidInput = {
        ...validInput,
        title: "",
      };
      const event = createMockEvent(invalidInput);

      await expect(createChart(event)).rejects.toThrow();
    });
  });
});
