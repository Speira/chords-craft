// The style catalogue. Same stability rule as MusicianRole: slugs are stored, labels are not.

import { Schema } from 'effect';

export const ALL = [
  'jazz',
  'funk',
  'soul',
  'rock',
  'pop',
  'blues',
  'gospel',
  'latin',
  'reggae',
  'hip-hop',
  'electronic',
  'classical',
  'folk',
  'metal',
  'world',
  'other',
] as const;

export type Slug = (typeof ALL)[number];

/** The one slug that requires a free-text `detail`. */
export const OTHER = 'other' satisfies Slug;

export const schema = Schema.Literal(...ALL);
