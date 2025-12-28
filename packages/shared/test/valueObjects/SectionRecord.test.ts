import { Effect, Exit } from "effect";

import { describe, expect, it } from "vitest";

import { Chord, Extension, Note, Quality, Section, SectionRecord } from "../../src";

describe("SectionRecord tests suite", () => {
  it("Should create empty SectionRecord", () => {
    const record = new SectionRecord();
    expect(record).toBeDefined();
  });

  it("Should create partial SectionRecord", () => {
    const record = new SectionRecord({
      [Section.Verse]: { default: [Chord.create({ root: Note.C })] },
    });
    expect(record).toBeDefined();
    expect(record).toHaveProperty(
      [Section.Verse, "default"],
      [Chord.create({ root: Note.C })],
    );
  });

  it("Should parse SectionRecord raw object", async () => {
    const parsing = SectionRecord.parse({
      Verse: { default: ["Cm7", "Am"] },
    });
    const record = await Effect.runPromise(parsing);
    expect(record).toBeDefined();
    expect(record).toHaveProperty(
      [Section.Verse, "default"],
      [
        Chord.create({ root: Note.C, quality: Quality.Minor, extension: Extension._7 }),
        Chord.create({ root: Note.A, quality: Quality.Minor }),
      ],
    );
  });

  it("Should return an Effect Error when parsing a non SectionRecord input", async () => {
    const str = "???";
    const parsing = SectionRecord.parse(str);
    const result = await Effect.runPromiseExit(parsing);
    if (Exit.isFailure(result)) {
      expect(result.cause).toBeDefined();
    } else {
      expect.fail("Should fail");
    }
  });
});
