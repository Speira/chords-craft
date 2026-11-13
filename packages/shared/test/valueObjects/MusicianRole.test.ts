import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { MusicianRole } from '#shared/valueObjects';

const decode = Schema.decodeUnknownEither(MusicianRole.schema);

describe('MusicianRole', () => {
  it('publishes exactly these slugs — renaming or removing one breaks stored profiles', () => {
    expect(MusicianRole.ALL).toEqual([
      'lead-vocals',
      'backing-vocals',
      'guitar',
      'bass',
      'double-bass',
      'violin',
      'viola',
      'cello',
      'piano',
      'keyboards',
      'organ',
      'synth',
      'drums',
      'percussion',
      'saxophone',
      'trumpet',
      'trombone',
      'flute',
      'clarinet',
      'sound-engineer',
      'dj',
      'music-director',
      'other',
    ]);
  });

  it('has no duplicate slug and every slug is kebab-case', () => {
    expect(new Set(MusicianRole.ALL).size).toBe(MusicianRole.ALL.length);
    for (const slug of MusicianRole.ALL) expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it('accepts a catalogue slug and rejects anything else', () => {
    expect(decode('guitar')._tag).toBe('Right');
    expect(decode('Guitar')._tag).toBe('Left');
    expect(decode('gtr')._tag).toBe('Left');
  });

  it('groups every slug under exactly one family', () => {
    const grouped = Object.values(MusicianRole.FAMILIES).flat();
    expect(grouped.toSorted()).toEqual([...MusicianRole.ALL].toSorted());
    expect(MusicianRole.FAMILIES.OTHER).toEqual([MusicianRole.OTHER]);
  });
});
