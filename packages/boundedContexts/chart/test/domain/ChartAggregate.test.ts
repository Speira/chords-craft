import { Cause, Effect, Exit } from "effect";

import { describe, expect, it } from "vitest";

import { Chord, Note, Section, TenantID } from "@speira/chordschart-shared";

import { ChartAggregate } from "../../src/domain/ChartAggregate";
import { ChartValidationError } from "../../src/domain/ChartErrors";
import { ChartArchived, ChartCreated } from "../../src/domain/ChartEvents";
import { generateChartId } from "../../src/domain/valueObjects/ChartID";

describe("ChartAggregate", () => {
  const cChord = new Chord({ root: Note.C });
  describe("create", () => {
    it("should create ChartCreated event", async () => {
      const command = {
        root: Note.C,
        tenantId: TenantID.make("tenant-1"),
        title: "My Chart",
        author: "John Doe",
        sections: { [Section.Verse]: [cChord] as const },
        plan: [Section.Verse] as const,
        links: [],
        tags: [],
      };

      const events = await Effect.runPromise(ChartAggregate.create(command));
      expect(events[0]).toBeInstanceOf(ChartCreated);
      expect(events).toHaveLength(1);
      expect(events[0]._tag).toBe("ChartCreated");
      expect(events[0]).toBeInstanceOf(ChartCreated);
      if (events[0] instanceof ChartCreated) {
        expect(events[0].title).toBe("My Chart");
        expect(events[0].root).toBe(Note.C);
        expect(events[0].isActive).toBe(true);
        expect(events[0].version).toBe(1);
      }
    });
  });

  describe("archive", () => {
    it("should create ChartArchived event for active chart", async () => {
      const tenantId = TenantID.make("tenant-1");

      const createdEvents = await Effect.runPromise(
        ChartAggregate.create({
          root: Note.C,
          tenantId,
          title: "Test",
          sections: { [Section.Verse]: [cChord] as const },
          plan: [Section.Verse] as const,
          links: [],
          tags: [],
        })
      );

      const chart = await Effect.runPromise(
        ChartAggregate.fromEvents(createdEvents)
      );

      const archiveEvents = await Effect.runPromise(
        ChartAggregate.archive(chart)
      );

      expect(archiveEvents).toHaveLength(1);
      expect(archiveEvents[0]).toBeInstanceOf(ChartArchived);
      expect(archiveEvents[0]._tag).toBe("ChartArchived");
    });
    it("should fail if chart already archived", async () => {
      const createdEvents = await Effect.runPromise(
        ChartAggregate.create({
          root: Note.C,
          tenantId: TenantID.make("tenant-1"),
          title: "Test",
          sections: { [Section.Verse]: [cChord] },
          plan: [Section.Verse],
          links: [],
          tags: [],
        })
      );

      const chart = await Effect.runPromise(
        ChartAggregate.fromEvents(createdEvents)
      );

      const archivedChart = chart.archiveChart(new Date());

      const result = await Effect.runPromiseExit(
        ChartAggregate.archive(archivedChart)
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Cause.failureOption(result.cause);
        expect(error._tag).toBe("Some");
        if (error._tag === "Some") {
          expect(error.value).toBeInstanceOf(ChartValidationError);
        }
      }
    });
  });

  describe("fromEvents", () => {
    it("should rebuild chart from ChartCreated event", async () => {
      const events = await Effect.runPromise(
        ChartAggregate.create({
          root: Note.C,
          tenantId: TenantID.make("tenant-1"),
          title: "My Chart",
          author: "John",
          sections: { [Section.Verse]: [cChord] as const },
          plan: [Section.Verse],
          links: ["http://example.com"],
          tags: ["jazz"],
        })
      );

      const chart = await Effect.runPromise(ChartAggregate.fromEvents(events));

      expect(chart.title).toBe("My Chart");
      expect(chart.root).toBe(Note.C);
      expect(chart.author).toBe("John");
      expect(chart.isActive).toBe(true);
    });

    it("should fail if first event is not ChartCreated", async () => {
      const archiveEvent = new ChartArchived({
        aggregateId: generateChartId(),
        tenantId: "tenant-1",
        occuredAt: new Date(),
        version: 1,
      });
      const result = await Effect.runPromiseExit(
        ChartAggregate.fromEvents([archiveEvent])
      );
      expect(Exit.isFailure(result)).toBe(true);
    });

    it("should apply ChartArchived event", async () => {
      const createEvents = await Effect.runPromise(
        ChartAggregate.create({
          root: Note.C,
          tenantId: TenantID.make("tenant-1"),
          title: "Test",
          sections: { [Section.Verse]: [cChord] as const },
          plan: [Section.Verse] as const,
          links: [],
          tags: [],
        })
      );

      const chart = await Effect.runPromise(
        ChartAggregate.fromEvents(createEvents)
      );

      const archiveEvents = await Effect.runPromise(
        ChartAggregate.archive(chart)
      );

      const archivedChart = await Effect.runPromise(
        ChartAggregate.fromEvents([...createEvents, ...archiveEvents])
      );

      expect(archivedChart.isActive).toBe(false);
    });
  });
});
