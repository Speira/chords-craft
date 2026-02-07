import { Effect, ParseResult, Schema } from "effect";

import * as Addition from "./Addition";
import * as Extension from "./Extension";
import * as Modifier from "./Modifier";
import * as Note from "./Note";
import * as Quality from "./Quality";

export interface ChordImput {
  root: Note.Note;
  tonic?: Note.Note;
  quality?: Quality.Quality;
  extension?: Extension.Extension;
  modifiers?: Array<Modifier.Modifier>;
  additions?: Array<Addition.Addition>;
}
/**
 * Chord management.
 *
 * ```ts
 * Chord.create({ root, quality, extension });
 * ```
 *
 * ```ts
 * Chord.parse("Cm7"); // {root: Note.C, quality: Quality.Minor, extension: Extension._7}
 * ```
 *
 * TODO: modifiers and additions not yet available
 */
export class Chord extends Schema.Class<Chord>("Chord")({
  notes: Schema.optional(Schema.Array(Note.schema)),
  root: Note.schema,
  tonic: Schema.optional(Note.schema),
  quality: Schema.optional(Quality.schema),
  extension: Schema.optional(Extension.schema),
  modifiers: Schema.optional(Schema.Array(Modifier.schema)),
  additions: Schema.optional(Schema.Array(Addition.schema)),
}) {
  static create(chordInput: ChordImput): Chord {
    return new Chord(chordInput);
  }

  static parse(strChord: string): Effect.Effect<Chord, ParseResult.ParseError> {
    return Effect.gen(function* () {
      const [note, afterNote] = yield* Note.build(strChord);
      const options: ChordImput = { root: note };
      const [quality, afterQuality] = yield* Quality.build(afterNote);
      options.quality = quality;
      const [ext] = yield* Extension.build(afterQuality);
      if (ext) options.extension = ext;
      // TODO: (v2) add modifiers and additions to options

      return new Chord(options);
    });
  }

  get toString(): string {
    return [
      this.root,
      this.quality,
      this.extension,
      this.modifiers?.join(""),
      this.additions?.join(""),
    ]
      .filter(Boolean)
      .join("");
  }
}

export const ChordTransform = Schema.transformOrFail(Schema.String, Chord, {
  strict: true,
  decode: (str, _, ast) =>
    Chord.parse(str).pipe(
      Effect.mapError((error) => new ParseResult.Type(ast, str, error.message)),
    ),
  encode: (chord) => Effect.succeed(chord.toString()),
});
