// The role catalogue: what a musician plays or does in a band.
// A slug is stored in profiles and memberships, so it is never renamed or removed once
// published. Labels live in the client dictionaries (`musicianRole.<slug>`).

import { Schema } from 'effect';

export const FAMILIES = {
  VOCALS: ['lead-vocals', 'backing-vocals'],
  STRINGS: ['guitar', 'bass', 'double-bass', 'violin', 'viola', 'cello'],
  KEYS: ['piano', 'keyboards', 'organ', 'synth'],
  DRUMS_PERCUSSION: ['drums', 'percussion'],
  BRASS_WINDS: ['saxophone', 'trumpet', 'trombone', 'flute', 'clarinet'],
  TECH: ['sound-engineer', 'dj', 'music-director'],
  OTHER: ['other'],
} as const;

export type Family = keyof typeof FAMILIES;
export type Slug = (typeof FAMILIES)[Family][number];

export const ALL: ReadonlyArray<Slug> = Object.values(FAMILIES).flat();

/** The one slug that requires a free-text `detail`. */
export const OTHER = 'other' satisfies Slug;

export const schema = Schema.Literal(...ALL);
