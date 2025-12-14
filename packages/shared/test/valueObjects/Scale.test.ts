import { describe, expect, it } from "vitest";

import { Note, Scale as ScaleRoot } from "../../src";

const { CHROMATIC_SCALE, Scale } = ScaleRoot;

describe("Scale tests suite", () => {
  it("Should have a complete chromatic scale const", () => {
    expect(CHROMATIC_SCALE).toContain(Note.A);
    expect(CHROMATIC_SCALE).toContain(Note.ASharp);
    expect(CHROMATIC_SCALE).toContain(Note.B);
    expect(CHROMATIC_SCALE).toContain(Note.C);
    expect(CHROMATIC_SCALE).toContain(Note.CSharp);
    expect(CHROMATIC_SCALE).toContain(Note.D);
    expect(CHROMATIC_SCALE).toContain(Note.DSharp);
    expect(CHROMATIC_SCALE).toContain(Note.E);
    expect(CHROMATIC_SCALE).toContain(Note.F);
    expect(CHROMATIC_SCALE).toContain(Note.FSharp);
    expect(CHROMATIC_SCALE).toContain(Note.G);
    expect(CHROMATIC_SCALE).toContain(Note.GSharp);
  });

  it("Should not have flat note in chromatic scale", () => {
    expect(CHROMATIC_SCALE).not.toContain(Note.AFlat);
    expect(CHROMATIC_SCALE).not.toContain(Note.BFlat);
    expect(CHROMATIC_SCALE).not.toContain(Note.DFlat);
    expect(CHROMATIC_SCALE).not.toContain(Note.EFlat);
    expect(CHROMATIC_SCALE).not.toContain(Note.GFlat);
  });

  it("Should correctly initialise new instance of Scale", () => {
    const myScale = Scale.create(Note.C);
    expect(myScale.chromatic[0]).toEqual(Note.C);
    expect(myScale.chromatic[1]).toEqual(Note.CSharp);
    expect(myScale.chromatic[2]).toEqual(Note.D);
    expect(myScale.chromatic[3]).toEqual(Note.DSharp);
    expect(myScale.chromatic[4]).toEqual(Note.E);
    expect(myScale.chromatic[5]).toEqual(Note.F);
    expect(myScale.chromatic[6]).toEqual(Note.FSharp);
    expect(myScale.chromatic[7]).toEqual(Note.G);
    expect(myScale.chromatic[8]).toEqual(Note.GSharp);
    expect(myScale.chromatic[9]).toEqual(Note.A);
    expect(myScale.chromatic[10]).toEqual(Note.ASharp);
    expect(myScale.chromatic[11]).toEqual(Note.B);
  });

  it("Should instanciate correctly a Flat note scale", () => {
    const myScale = Scale.create(Note.GFlat);
    expect(myScale.chromatic[0]).toEqual(Note.FSharp);
    expect(myScale.chromatic[1]).toEqual(Note.G);
    expect(myScale.chromatic[2]).toEqual(Note.GSharp);
    expect(myScale.chromatic[3]).toEqual(Note.A);
    expect(myScale.chromatic[4]).toEqual(Note.ASharp);
    expect(myScale.chromatic[5]).toEqual(Note.B);
    expect(myScale.chromatic[6]).toEqual(Note.C);
    expect(myScale.chromatic[7]).toEqual(Note.CSharp);
    expect(myScale.chromatic[8]).toEqual(Note.D);
    expect(myScale.chromatic[9]).toEqual(Note.DSharp);
    expect(myScale.chromatic[10]).toEqual(Note.E);
    expect(myScale.chromatic[11]).toEqual(Note.F);
  });
});
