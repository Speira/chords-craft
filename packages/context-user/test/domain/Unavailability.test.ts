import { Schema } from 'effect';

import { BandID, LocalDate, UserID } from '@chordcraft/shared/valueObjects';
import { describe, expect, it } from 'vitest';

import { Unavailability } from '#context-user/domain/Unavailability';
import { UnavailabilityFieldsSchema, UnavailabilityID } from '#context-user/domain/valueObjects';

const BAND_A = BandID.schema.make('band_0f6c2c3e-1d4b-4c9a-9a0e-2b7c1d9e8f00');
const BAND_B = BandID.schema.make('band_1a2b3c4d-1d4b-4c9a-9a0e-2b7c1d9e8f00');
const date = (value: string) => LocalDate.schema.make(value);

function entry(scope: unknown) {
  return Unavailability.create({
    id: UnavailabilityID.generate(),
    userId: UserID.schema.make('user_ana'),
    fields: Schema.decodeUnknownSync(UnavailabilityFieldsSchema)({
      range: { from: '2026-08-01', to: '2026-08-15' },
      reason: 'holiday',
      scope,
    }),
  });
}

describe('Unavailability', () => {
  it('applies to every band when scoped to ALL', () => {
    const holiday = entry('ALL');
    expect(holiday.checkAppliesTo(BAND_A, date('2026-08-10'))).toBe(true);
    expect(holiday.checkAppliesTo(BAND_B, date('2026-08-10'))).toBe(true);
  });

  it('applies only to the listed bands otherwise', () => {
    const scoped = entry({ bandIds: [BAND_A] });
    expect(scoped.checkAppliesTo(BAND_A, date('2026-08-10'))).toBe(true);
    expect(scoped.checkAppliesTo(BAND_B, date('2026-08-10'))).toBe(false);
  });

  it('does not apply outside its range', () => {
    expect(entry('ALL').checkAppliesTo(BAND_A, date('2026-08-16'))).toBe(false);
  });

  it('dedupes band ids', () => {
    const scoped = entry({ bandIds: [BAND_A, BAND_A] });
    expect(scoped.scope).toEqual({ bandIds: [BAND_A] });
  });

  it('rejects an empty band list: no bands means scope ALL', () => {
    expect(
      Schema.decodeUnknownEither(UnavailabilityFieldsSchema)({
        range: { from: '2026-08-01', to: '2026-08-15' },
        scope: { bandIds: [] },
      })._tag,
    ).toBe('Left');
  });
});
