import { Effect, type ParseResult, pipe, Schema } from "effect";
import { ParseError, Unexpected } from "effect/ParseResult";

import { Typeguards } from "..//utils";

import { Chord } from "./Chord";
import * as Section from "./Section";

const SectionRecordValue = Schema.optional(
  Schema.Record({ key: Schema.String, value: Schema.Array(Chord) }),
);

/**
 * Ex:
 *
 * ```json
 * {
 *   "Intro": {
 *     "0": ["Cm7", "Dm7"], // default version
 *     "1": ["Cm7b5", "Dm13"] // -> Other version of this section
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
    if (!Typeguards.checkIsPlainObject(params)) {
      return Effect.fail(
        new ParseError({
          issue: new Unexpected(params, "Expected a plain object for SectionRecord"),
        }),
      );
    }

    return pipe(
      // Transform each section's chord strings into Chord instances
      Effect.all(
        Object.entries(params).map(([sectionKey, versions]) =>
          pipe(
            Section.parse(sectionKey),
            Effect.flatMap((validSection) => {
              if (!Typeguards.checkIsPlainObject(versions)) {
                return Effect.fail(
                  new ParseError({
                    issue: new Unexpected(
                      versions,
                      `Expected versions object for ${sectionKey}`,
                    ),
                  }),
                );
              }

              // Parse each version's chord strings
              return pipe(
                Effect.all(
                  Object.entries(versions).map(([versionKey, chordStrings]) => {
                    if (!Array.isArray(chordStrings)) {
                      return Effect.fail(
                        new ParseError({
                          issue: new Unexpected(
                            chordStrings,
                            `Expected array of chord strings`,
                          ),
                        }),
                      );
                    }

                    return pipe(
                      Effect.all(chordStrings.map((str) => Chord.parse(str))),
                      Effect.map((chords) => [versionKey, chords] as const),
                    );
                  }),
                ),
                Effect.map((parsedVersions) => {
                  const versionRecord: Record<string, Array<Chord>> = {};
                  for (const [versionKey, chords] of parsedVersions) {
                    versionRecord[versionKey] = chords;
                  }
                  return [validSection, versionRecord] as const;
                }),
              );
            }),
          ),
        ),
      ),
      Effect.flatMap((parsedSections) => {
        const record: Partial<Record<Section.Section, Record<string, Array<Chord>>>> = {};
        for (const [section, versions] of parsedSections) {
          record[section] = versions;
        }
        return Schema.decodeUnknown(SectionRecord)(record);
      }),
    );
  }
}
