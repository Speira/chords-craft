import { Effect, ParseResult, Schema } from "effect";

import { Chord } from "./Chord";
import * as Section from "./Section";

const ChordTransform = Schema.transformOrFail(Schema.String, Chord, {
  strict: true,
  decode: (str, _, ast) =>
    Chord.parse(str).pipe(
      Effect.mapError((error) => new ParseResult.Type(ast, str, error.message)),
    ),
  encode: (chord) => Effect.succeed(chord.toString()),
});

const SectionRecordValue = Schema.optional(
  Schema.Record({ key: Schema.String, value: Schema.Array(ChordTransform) }),
);

/**
 * Ex:
 *
 * ```json
 * {
 *   "Intro": {
 *     "default": ["Cm7", "Dm7"], // default version
 *     "subtil": ["Cm7b5", "Dm13"] // -> Other version of this section
 *   }
 * }
 * ```
 */
export class SectionRecord extends Schema.Class<SectionRecord>("SectionRecord")({
  [Section.Intro]: SectionRecordValue,
  [Section.Verse]: SectionRecordValue,
  [Section.Transition]: SectionRecordValue,
  [Section.Chorus]: SectionRecordValue,
  [Section.Interlude]: SectionRecordValue,
  [Section.Bridge]: SectionRecordValue,
  [Section.Ending]: SectionRecordValue,
}) {
  static parse(params: unknown): Effect.Effect<SectionRecord, ParseResult.ParseError> {
    return Schema.decodeUnknown(SectionRecord)(params);
  }
}
