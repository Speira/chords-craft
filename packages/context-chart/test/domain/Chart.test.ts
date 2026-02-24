import { Effect, Exit } from "effect";

import { describe, expect, it } from "vitest";

import {
  Chord,
  Note,
  Quality,
  Section,
  TenantID,
} from "@speira/chordschart-shared/valueObjects";

import { Chart } from "../../src/domain/Chart";
import { ChartID } from "../../src/domain/valueObjects";

describe("Chart", () => {
  const createTestChart = () => {
    return Chart.create({
      id: ChartID.generate(),
      tenantId: TenantID.schema.make("tenant-1"),
      root: Note.C,
      author: "John Doe",
      title: "Original Title",
      structure: { [Section.Verse]: { default: [new Chord({ root: Note.C })] } },
      plan: [Section.Verse],
      links: ["https://example.com"],
      tags: ["jazz"],
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
  };

  describe("updateTitle", () => {
    it("should update title and updatedAt", async () => {
      const chart = createTestChart();
      const newDate = new Date("2024-01-02");

      const updated = await Effect.runPromise(
        Chart.update(chart, { title: "New Title", updatedAt: newDate }),
      );

      expect(updated.title).toBe("New Title");
      expect(updated.updatedAt).toEqual(newDate);
      expect(updated.id).toBe(chart.id);
      expect(updated.author).toBe(chart.author);
    });
  });

  describe("updateAuthor", () => {
    it("should update author and updatedAt", async () => {
      const chart = createTestChart();
      const newDate = new Date("2024-01-02");

      const updated = await Effect.runPromise(
        Chart.update(chart, { author: "Jane Doe", updatedAt: newDate }),
      );

      expect(updated.author).toBe("Jane Doe");
      expect(updated.updatedAt).toEqual(newDate);
      expect(updated.title).toBe(chart.title); // unchanged
    });
  });

  describe("updatePlan", () => {
    it("should update plan and updatedAt", async () => {
      const chart = createTestChart();
      const newPlan = [Section.Intro, Section.Verse, Section.Chorus];
      const newDate = new Date("2024-01-02");

      const updated = await Effect.runPromise(
        Chart.update(chart, { plan: newPlan, updatedAt: newDate }),
      );

      expect(updated.plan).toEqual(newPlan);
      expect(updated.updatedAt).toEqual(newDate);
    });
  });

  describe("updateStructure", () => {
    it("should update structure and updatedAt", async () => {
      const chart = createTestChart();
      const chordsExample = [
        Chord.create({ root: Note.C, quality: Quality.Minor }),
        Chord.create({ root: Note.F, quality: Quality.Minor }),
      ];
      const newStructure = {
        [Section.Intro]: {
          default: ["Cm", "Fm"],
        },
        [Section.Verse]: {
          default: ["Cm", "Fm"],
        },
      };
      const newDate = new Date("2024-01-02");

      const updated = await Effect.runPromise(
        Chart.update(chart, {
          structure: newStructure,
          updatedAt: newDate,
        }),
      );

      expect(updated.structure).toEqual(
        expect.objectContaining({
          [Section.Intro]: {
            default: chordsExample,
          },
          [Section.Verse]: {
            default: chordsExample,
          },
        }),
      );
      expect(updated.updatedAt).toEqual(newDate);
    });

    it("should fail on update structure with wrong argument", async () => {
      const chart = createTestChart();
      const wrongStructure = {
        default: {
          [Section.Intro]: [],
          [Section.Verse]: [],
        },
      };
      const newDate = new Date("2024-01-02");

      const result = await Effect.runPromiseExit(
        Chart.update(chart, {
          structure: wrongStructure,
          updatedAt: newDate,
        }),
      );
      expect(Exit.isFailure(result)).toBe(true);
    });
  });

  describe("updateTags", () => {
    it("should update tags and updatedAt", async () => {
      const chart = createTestChart();
      const newTags = ["rock", "blues"];
      const newDate = new Date("2024-01-02");

      const updated = await Effect.runPromise(
        Chart.update(chart, { tags: newTags, updatedAt: newDate }),
      );

      expect(updated.tags).toEqual(newTags);
      expect(updated.updatedAt).toEqual(newDate);
    });
  });

  describe("updateLinks", () => {
    it("should update links and updatedAt", async () => {
      const chart = createTestChart();
      const newLinks = ["https://newlink.com", "https://another.com"];
      const newDate = new Date("2024-01-02");

      const updated = await Effect.runPromise(
        Chart.update(chart, { links: newLinks, updatedAt: newDate }),
      );

      expect(updated.links).toEqual(newLinks);
      expect(updated.updatedAt).toEqual(newDate);
    });
  });

  describe("archiveChart", () => {
    it("should set isActive to false and update updatedAt", async () => {
      const chart = createTestChart();
      const newDate = new Date("2024-01-02");

      const archived = await Effect.runPromise(
        Chart.update(chart, { isActive: false, updatedAt: newDate }),
      );

      expect(archived.isActive).toBe(false);
      expect(archived.updatedAt).toEqual(newDate);
      expect(archived.id).toBe(chart.id); // immutable
    });
  });
});
