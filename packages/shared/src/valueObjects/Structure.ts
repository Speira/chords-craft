import { Schema } from 'effect';

import { ChordTransform } from './Chord';
import * as Section from './Section';

const StyleChordsMap = Schema.optional(
  Schema.Record({ key: Schema.String, value: Schema.Array(ChordTransform) }),
);

/**
 * @example
 *   ```json
 *   {
 *     "Intro": {
 *       "default": ["Cm7", "Dm7"], // default version
 *       "jazz": ["Cm7b5", "Dm13"] // -> Other version of this section
 *     }
 *   }
 *   ```;
 */
export const schema = Schema.Struct({
  [Section.Intro]: StyleChordsMap,
  [Section.Verse]: StyleChordsMap,
  [Section.Transition]: StyleChordsMap,
  [Section.Chorus]: StyleChordsMap,
  [Section.Interlude]: StyleChordsMap,
  [Section.Bridge]: StyleChordsMap,
  [Section.Ending]: StyleChordsMap,
});

export type Structure = typeof schema.Type;

/**
 * The encoded side of {@link schema}: chords are still shorthand strings (`"Cm7"`). This is what
 * crosses the wire, so it is the shape a client builds before the API decodes it.
 */
export type StructureInput = typeof schema.Encoded;

export const parse = (params: unknown) => Schema.decodeUnknown(schema)(params);
