import { Effect, Exit } from "effect";

import { describe, expect, it } from "vitest";

import { Chord, Extension, Note, Quality, Section, Structure } from "../../src";

describe("Structure tests suite", () => {
  it("Should parse valid object to Structure", () => {
    const record = {
      Intro: {
        default: ["Cm7", "Dm7"],
      },
    };
    const result = Effect.runSync(Structure.parse(record));
    expect(result[Section.Intro]).toHaveProperty("default", [
      Chord.create({ root: Note.C, quality: Quality.Minor, extension: Extension._7 }),
      Chord.create({ root: Note.D, quality: Quality.Minor, extension: Extension._7 }),
    ]);
  });

  it("Should parse Structure raw object", async () => {
    const parsing = Structure.parse({
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

  it("Should return an Effect Error when parsing a non Structure input", async () => {
    const str = "???";
    const parsing = Structure.parse(str);
    const result = await Effect.runPromiseExit(parsing);
    if (Exit.isFailure(result)) {
      expect(result.cause).toBeDefined();
    } else {
      expect.fail("Should fail");
    }
  });
});
