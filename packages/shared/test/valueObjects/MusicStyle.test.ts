import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { MusicStyle } from '#shared/valueObjects';

describe('MusicStyle', () => {
  it('publishes exactly these slugs — renaming or removing one breaks stored profiles', () => {
    expect(MusicStyle.ALL).toEqual([
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
    ]);
  });

  it('accepts a catalogue slug and rejects anything else', () => {
    expect(Schema.decodeUnknownEither(MusicStyle.schema)('funk')._tag).toBe('Right');
    expect(Schema.decodeUnknownEither(MusicStyle.schema)('Funk')._tag).toBe('Left');
  });
});
