import { describe, expect, it } from "vitest";

import { Note } from "../../../src/domain/value-objects";
import { Cause, Effect, Exit } from "effect";

describe("Note test suite", () => {
  it("Should have all notes available", () => {
    expect(Note.A).toBe("A");
    expect(Note.ASharp).toBe("A♯");
    expect(Note.AFlat).toBe("A♭");

    expect(Note.B).toBe("B");
    expect(Note.BFlat).toBe("B♭");

    expect(Note.C).toBe("C");
    expect(Note.CSharp).toBe("C♯");

    expect(Note.D).toBe("D");
    expect(Note.DSharp).toBe("D♯");
    expect(Note.DFlat).toBe("D♭");

    expect(Note.E).toBe("E");
    expect(Note.EFlat).toBe("E♭");

    expect(Note.F).toBe("F");
    expect(Note.FSharp).toBe("F♯");

    expect(Note.G).toBe("G");
    expect(Note.GSharp).toBe("G♯");
    expect(Note.GFlat).toBe("G♭");

    expect([
      Note.AFlat,
      Note.A,
      Note.ASharp,
      Note.BFlat,
      Note.B,
      Note.C,
      Note.CSharp,
      Note.DFlat,
      Note.D,
      Note.DSharp,
      Note.EFlat,
      Note.E,
      Note.F,
      Note.FSharp,
      Note.GFlat,
      Note.G,
      Note.GSharp,
    ]).toEqual(expect.arrayContaining(Note.ALL));
  });

  it("Should convert flat note to the corresponding sharp note", () => {
    expect(Note.flatToSharp(Note.AFlat)).toBe(Note.GSharp);
    expect(Note.flatToSharp(Note.BFlat)).toBe(Note.ASharp);
    expect(Note.flatToSharp(Note.DFlat)).toBe(Note.CSharp);
    expect(Note.flatToSharp(Note.EFlat)).toBe(Note.DSharp);
    expect(Note.flatToSharp(Note.GFlat)).toBe(Note.FSharp);
  });

  it("Should not convert unflat note to sharp note", () => {
    expect(Note.flatToSharp(Note.A)).toBe(Note.A);
    expect(Note.flatToSharp(Note.ASharp)).toBe(Note.ASharp);
  });

  it("Should convert sharp note to the correspondig flat note", () => {
    expect(Note.sharpToFlat(Note.ASharp)).toBe(Note.BFlat);
    expect(Note.sharpToFlat(Note.CSharp)).toBe(Note.DFlat);
    expect(Note.sharpToFlat(Note.DSharp)).toBe(Note.EFlat);
    expect(Note.sharpToFlat(Note.FSharp)).toBe(Note.GFlat);
    expect(Note.sharpToFlat(Note.GSharp)).toBe(Note.AFlat);
  });

  it("Should not convert unchart note to flat note", () => {
    expect(Note.sharpToFlat(Note.A)).toBe(Note.A);
    expect(Note.sharpToFlat(Note.AFlat)).toBe(Note.AFlat);
  });

  it("Should parse a string note to a note", async () => {
    const A = await Effect.runPromise(Note.parse("A"));
    const ASh = await Effect.runPromise(Note.parse("A♯"));
    expect(A).toBe(Note.A);
    expect(ASh).toBe(Note.ASharp);
  });

  it("Should fails when checkNote fails", async () => {
    await expect(Effect.runPromise(Note.parse("NotANote"))).rejects.toThrow(
      'the string "NotANote" is not a note'
    );
  });

  it("Should be able to check accidents note", () => {
    const Asharp = "A#";
    const isAsharpAccidental = Note.checkAccidental(Asharp);
    expect(isAsharpAccidental).toBe(true);
    const A = "A";
    const isAAccidental = Note.checkAccidental(A);
    expect(isAAccidental).toBe(false);
  });

  it("Should returns a failure Exit when invalid", async () => {
    const exit = await Effect.runPromiseExit(Note.parse("???"));
    if (Exit.isFailure(exit)) {
      expect(exit.cause).toBeDefined();
      const message = Cause.pretty(exit.cause);
      expect(message).toContain('the string "???" is not a note');
    }
  });

  it("Should be able to build from Chord string", async () => {
    const chordStr1 = "C#sus2";
    const [note1, afterNote1] = await Effect.runPromise(Note.build(chordStr1));
    expect(note1).toBe(Note.CSharp);
    expect(afterNote1).toBe("sus2");

    const chordStr2 = "Em7";
    const [note2, afterNote2] = await Effect.runPromise(Note.build(chordStr2));
    expect(note2).toBe(Note.E);
    expect(afterNote2).toBe("m7");
  });
});
