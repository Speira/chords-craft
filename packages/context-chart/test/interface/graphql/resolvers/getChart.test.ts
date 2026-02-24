import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getChart } from "../../../../src/interface/graphql/resolvers/getChart";
import { type ResolverEvent } from "../../../../src/interface/graphql/resolvers/types";

describe("getChart resolver", () => {
  const validInput = {
    chartId: "01HQ3X5Z8M9N6P7R8S9T0V1W2X",
    tenantId: "tenant-123",
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
      parentTypeName: "Query",
      fieldName: "getChart",
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
    it("should reject missing required chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "GetChart resolver handler failed:",
        expect.any(Object),
      );
    });

    it("should reject missing required tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject empty chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "",
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject empty tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: "",
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject invalid chartId format", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "invalid-ulid-format",
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject chartId that is too short", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "SHORT",
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject chartId that is too long", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "A".repeat(27), // ULID should be exactly 26 characters
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject chartId with invalid characters", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "01HQ3X5Z8M9N6P7R8S9T0V!@#$", // Invalid characters
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject tenantId that is too long", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: "A".repeat(256), // Assuming max length validation
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject null chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: null,
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject null tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: null,
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject numeric chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: 12345,
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject object as chartId", async () => {
      const invalidInput = {
        ...validInput,
        chartId: { id: "test" },
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should reject array as tenantId", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: ["tenant-1", "tenant-2"],
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should log errors with correct message format", async () => {
      const invalidInput = {
        ...validInput,
        chartId: "",
      };
      const event = createMockEvent(invalidInput);

      try {
        await getChart(event);
        expect.fail("Should have thrown an error");
      } catch {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "GetChart resolver handler failed:",
          expect.any(Object),
        );
      }
    });

    it("should rethrow errors after logging", async () => {
      const invalidInput = {
        ...validInput,
        tenantId: "",
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
    });

    it("should handle missing both required fields", async () => {
      const invalidInput = {
        chartId: undefined,
        tenantId: undefined,
      };
      const event = createMockEvent(invalidInput);

      await expect(getChart(event)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
