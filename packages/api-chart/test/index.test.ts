import type { AppSyncResolverEvent } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChartInterface } from "@speira/chordschart-context-chart";

import { handler } from "../src/index";

vi.mock("@speira/chordschart-context-chart", () => ({
  ChartInterface: {
    graphql: {
      resolvers: {
        createChart: vi.fn(() => Promise.resolve({ id: "chart_1" })),
        getChart: vi.fn(() => Promise.resolve({ id: "chart_1" })),
        listCharts: vi.fn(() => Promise.resolve([])),
      },
    },
  },
}));

const { createChart, getChart, listCharts } = ChartInterface.graphql.resolvers;

const makeEvent = (opts: {
  fieldName?: string;
  args?: Record<string, unknown>;
  identity?: unknown;
}): AppSyncResolverEvent<Record<string, unknown>> =>
  ({
    info: { fieldName: opts.fieldName ?? "createChart" },
    arguments: opts.args ?? {},
    identity:
      "identity" in opts
        ? opts.identity
        : { resolverContext: { userId: "user_1", tenantId: "tenant_real" } },
  }) as unknown as AppSyncResolverEvent<Record<string, unknown>>;

// Shared resolver mocks are asserted on; keep serial under concurrent default.
describe.sequential("api-chart handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authorization guards", () => {
    it("rejects when identity has no resolver context", async () => {
      await expect(handler(makeEvent({ identity: null }))).rejects.toThrow(
        "Unauthorized: No identity context",
      );
      expect(createChart).not.toHaveBeenCalled();
    });

    it("rejects when the resolver context has no tenantId", async () => {
      await expect(
        handler(makeEvent({ identity: { resolverContext: { userId: "user_1" } } })),
      ).rejects.toThrow("Unauthorized: No tenant");
    });
  });

  describe("tenant isolation", () => {
    it("injects the authenticated tenantId, overriding any client-supplied value", async () => {
      await handler(
        makeEvent({
          fieldName: "createChart",
          args: { tenantId: "tenant_attacker", title: "Song" },
        }),
      );

      expect(createChart).toHaveBeenCalledWith({
        title: "Song",
        tenantId: "tenant_real",
      });
    });
  });

  describe("routing", () => {
    it("routes getChart to the getChart resolver", async () => {
      await handler(makeEvent({ fieldName: "getChart", args: { chartId: "c1" } }));

      expect(getChart).toHaveBeenCalledOnce();
      expect(createChart).not.toHaveBeenCalled();
    });

    it("routes listCharts to the listCharts resolver", async () => {
      await handler(makeEvent({ fieldName: "listCharts" }));

      expect(listCharts).toHaveBeenCalledOnce();
    });

    it("throws on an unknown field", async () => {
      await expect(handler(makeEvent({ fieldName: "deleteEverything" }))).rejects.toThrow(
        "Unknown field: deleteEverything",
      );
    });
  });
});
