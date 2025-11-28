import { Effect, ParseResult, Schema } from "effect";
import * as Note from "./Note";
import * as Quality from "./Quality";
import * as Extension from "./Extension";
import * as Modifier from "./Modifier";
import * as Addition from "./Addition";

interface ChordImput {
  root: Note.Note;
  tonic?: Note.Note;
  quality?: Quality.Quality;
  extension?: Extension.Extension;
  modifiers?: Modifier.Modifier[];
  additions?: Addition.Addition[];
}

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
      // TODO: add modifiers and additions to options

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
