import { describe, expect, it } from "vitest";

import { Note, Section, TenantID } from "@speira/chordschart-shared";

import { Chart } from "../../src/domain/Chart";
import { generateChartId } from "../../src/domain/valueObjects/ChartID";

describe("Chart", () => {
  const createTestChart = () => {
    return new Chart({
      id: generateChartId(),
      tenantId: TenantID.make("tenant-1"),
      root: Note.C,
      author: "John Doe",
      title: "Original Title",
      sections: { [Section.Verse]: [] },
      plan: [Section.Verse],
      links: ["https://example.com"],
      tags: ["jazz"],
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
  };

  describe("updateTitle", () => {
    it("should update title and updatedAt", () => {
      const chart = createTestChart();
      const newDate = new Date("2024-01-02");

      const updated = chart.updateTitle("New Title", newDate);

      expect(updated.title).toBe("New Title");
      expect(updated.updatedAt).toEqual(newDate);
      expect(updated.id).toBe(chart.id); // immutable
      expect(updated.author).toBe(chart.author); // unchanged
    });
  });

  describe("updateAuthor", () => {
    it("should update author and updatedAt", () => {
      const chart = createTestChart();
      const newDate = new Date("2024-01-02");

      const updated = chart.updateAuthor("Jane Doe", newDate);

      expect(updated.author).toBe("Jane Doe");
      expect(updated.updatedAt).toEqual(newDate);
      expect(updated.title).toBe(chart.title); // unchanged
    });
  });

  describe("updatePlan", () => {
    it("should update plan and updatedAt", () => {
      const chart = createTestChart();
      const newPlan = [Section.Intro, Section.Verse, Section.Chorus];
      const newDate = new Date("2024-01-02");

      const updated = chart.updatePlan(newPlan, newDate);

      expect(updated.plan).toEqual(newPlan);
      expect(updated.updatedAt).toEqual(newDate);
    });
  });

  describe("updateSections", () => {
    it("should update sections and updatedAt", () => {
      const chart = createTestChart();
      const newSections = {
        [Section.Intro]: [],
        [Section.Verse]: [],
      };
      const newDate = new Date("2024-01-02");

      const updated = chart.updateSections(newSections, newDate);

      expect(updated.sections).toEqual(newSections);
      expect(updated.updatedAt).toEqual(newDate);
    });
  });

  describe("updateTags", () => {
    it("should update tags and updatedAt", () => {
      const chart = createTestChart();
      const newTags = ["rock", "blues"];
      const newDate = new Date("2024-01-02");

      const updated = chart.updateTags(newTags, newDate);

      expect(updated.tags).toEqual(newTags);
      expect(updated.updatedAt).toEqual(newDate);
    });
  });

  describe("updateLinks", () => {
    it("should update links and updatedAt", () => {
      const chart = createTestChart();
      const newLinks = ["https://newlink.com", "https://another.com"];
      const newDate = new Date("2024-01-02");

      const updated = chart.updateLinks(newLinks, newDate);

      expect(updated.links).toEqual(newLinks);
      expect(updated.updatedAt).toEqual(newDate);
    });
  });

  describe("archiveChart", () => {
    it("should set isActive to false and update updatedAt", () => {
      const chart = createTestChart();
      const newDate = new Date("2024-01-02");

      const archived = chart.archiveChart(newDate);

      expect(archived.isActive).toBe(false);
      expect(archived.updatedAt).toEqual(newDate);
      expect(archived.id).toBe(chart.id); // immutable
    });
  });
});
