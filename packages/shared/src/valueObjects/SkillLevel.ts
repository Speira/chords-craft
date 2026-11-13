// A self-assessed level per role, shown as 1 to 5 stars. There is no zero: an absent level
// means "not specified". The order of LEVELS is the ranking, so it never changes.

import { Schema } from 'effect';

export const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL', 'MASTER'] as const;

export type SkillLevel = (typeof LEVELS)[number];

export const schema = Schema.Literal(...LEVELS);

/** The star count, 1 to 5; what a future musician search compares. */
export const rankOf = (level: SkillLevel) => LEVELS.indexOf(level) + 1;
