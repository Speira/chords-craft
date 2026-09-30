import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { SkillLevel } from '#shared/valueObjects';

describe('SkillLevel', () => {
  it('ranks the levels from 1 (beginner) to 5 (master)', () => {
    expect(SkillLevel.LEVELS.map((level) => SkillLevel.rankOf(level))).toEqual([1, 2, 3, 4, 5]);
    expect(SkillLevel.rankOf('PROFESSIONAL')).toBe(4);
  });

  it('has no zero level: absence means "not specified"', () => {
    expect(Schema.decodeUnknownEither(SkillLevel.schema)('NONE')._tag).toBe('Left');
    expect(Schema.decodeUnknownEither(SkillLevel.schema)(0)._tag).toBe('Left');
  });
});
