import { Effect } from "effect";

import { describe, expect, it } from "vitest";

import {
  Chord,
  Extension,
  Note,
  Quality,
} from "../../../src/domain/value-objects";

describe("Chord tests suite", () => {
  it("Should create chord", () => {
    const chord = Chord.create({ root: Note.A });
    expect(chord).toBeDefined();
  });

  it("Should parse simple string chord", async () => {
    const strChord = "C";
    const parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.C);
    expect(parsedChord.quality).toBe(Quality.Major);
  });
  it("Should parse sharp string chord", async () => {
    const strChord = "C#";
    const parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.CSharp);
    expect(parsedChord.root).not.toBe(Note.C);
  });
  it("Should parse string chord with quality", async () => {
    let strChord = "Cm";
    let parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.C);
    expect(parsedChord.quality).toBe(Quality.Minor);
    expect(parsedChord.quality).not.toBe(Quality.Major);

    strChord = "Csus4";
    parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.C);
    expect(parsedChord.quality).toBe(Quality.Sus4);
    expect(parsedChord.quality).not.toBe(Quality.Major);
  });
  it("Should parse string chord with extension", async () => {
    let strChord = "C7";
    let parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.C);
    expect(parsedChord.quality).toBe(Quality.Major);
    expect(parsedChord.extension).toBe(Extension._7);

    strChord = "CMaj7";
    parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.C);
    expect(parsedChord.quality).toBe(Quality.Major);
    expect(parsedChord.extension).toBe(Extension.M7);

    strChord = "FΔ7";
    parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.F);
    expect(parsedChord.quality).toBe(Quality.Major);
    expect(parsedChord.extension).toBe(Extension.M7);

    strChord = "GbMaj11";
    parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.GFlat);
    expect(parsedChord.quality).toBe(Quality.Major);
    expect(parsedChord.extension).toBe(Extension.M11);

    strChord = "Bb11";
    parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.BFlat);
    expect(parsedChord.quality).toBe(Quality.Major);
    expect(parsedChord.extension).toBe(Extension._11);

    strChord = "Bbm11";
    parsedChord = await Effect.runPromise(Chord.parse(strChord));
    expect(parsedChord.root).toBe(Note.BFlat);
    expect(parsedChord.quality).toBe(Quality.Minor);
    expect(parsedChord.extension).toBe(Extension._11);
  });
});
