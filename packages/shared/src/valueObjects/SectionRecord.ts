import { Schema } from "effect";

import { ChordTransform } from "./Chord";
import * as Section from "./Section";

const SectionRecordValue = Schema.optional(
  Schema.Record({ key: Schema.String, value: Schema.Array(ChordTransform) }),
);

/**
 * @deprecated Replace by Structure Ex:
 *
 *   ```json
 *   {
 *     "Intro": {
 *       "default": ["Cm7", "Dm7"], // default version
 *       "jazz": ["Cm7b5", "Dm13"] // -> Other version of this section
 *     }
 *   }
 *   ```
 */
export const schema = Schema.Struct({
  [Section.Intro]: SectionRecordValue,
  [Section.Verse]: SectionRecordValue,
  [Section.Transition]: SectionRecordValue,
  [Section.Chorus]: SectionRecordValue,
  [Section.Interlude]: SectionRecordValue,
  [Section.Bridge]: SectionRecordValue,
  [Section.Ending]: SectionRecordValue,
});

export type SectionRecord = typeof schema.Type;

/** @deprecated Replaced by Structure */
export const parse = (params: unknown) => Schema.decodeUnknown(schema)(params);
