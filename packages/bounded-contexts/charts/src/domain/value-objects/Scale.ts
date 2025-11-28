import { Schema } from "effect";
import * as Note from "./Note";

export const CHROMATIC_SCALE: Note.Note[] = [Note.A, Note.ASharp, Note.B, Note.C, Note.CSharp, Note.D, Note.DSharp, Note.E, Note.F, Note.FSharp, Note.G, Note.GSharp]; // prettier-ignore

/**
 * Scale manages a group of notes in a structural way.
 * should use the static function `Scale.create` instead of `new Scale()`
 * */
export class Scale extends Schema.Class<Scale>("Scale")({
  root: Note.schema,
  chromatic: Schema.Array(Note.schema),
}) {
  static create(note: Note.Note) {
    return new Scale({
      root: note,
      chromatic: Scale.getChromaticFrom(note),
    });
  }

  static getChromaticFrom(root: Note.Note) {
    const index = CHROMATIC_SCALE.indexOf(Note.flatToSharp(root));
    if (index === -1 || root === Note.A) return CHROMATIC_SCALE;
    return CHROMATIC_SCALE.slice(index).concat(CHROMATIC_SCALE.slice(0, index));
  }
}
