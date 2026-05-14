import { describe, expect, it } from "vitest";

import { listCharts } from "../../../../src/interface/graphql/resolvers/listCharts";
import { type ResolverEvent } from "../../../../src/interface/graphql/resolvers/types";

describe("listCharts resolver", () => {
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
      parentTypeName: "Query",
      fieldName: "listCharts",
      variables: {},
    },
    stash: {},
  });

  describe("validation tests", () => {
    it("should reject missing required tenantId", async () => {
      const invalidInput = {
        tenantId: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject empty tenantId", async () => {
      const invalidInput = {
        tenantId: "",
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject null tenantId", async () => {
      const invalidInput = {
        tenantId: null,
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject numeric tenantId", async () => {
      const invalidInput = {
        tenantId: 12345,
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject boolean tenantId", async () => {
      const invalidInput = {
        tenantId: true,
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject object as tenantId", async () => {
      const invalidInput = {
        tenantId: { id: "tenant-123" },
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject array as tenantId", async () => {
      const invalidInput = {
        tenantId: ["tenant-1", "tenant-2"],
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject tenantId that is too long", async () => {
      const invalidInput = {
        tenantId: "A".repeat(256),
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject tenantId with only whitespace", async () => {
      const invalidInput = {
        tenantId: "   ",
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should reject undefined input", async () => {
      const invalidInput = undefined as unknown as Record<string, unknown>;
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should rethrow errors", async () => {
      const invalidInput = {
        tenantId: null,
      };
      const event = createMockEvent(invalidInput);

      await expect(listCharts(event)).rejects.toThrow();
    });

    it("should handle empty arguments object", async () => {
      const event = createMockEvent({});

      await expect(listCharts(event)).rejects.toThrow();
    });
  });
});
