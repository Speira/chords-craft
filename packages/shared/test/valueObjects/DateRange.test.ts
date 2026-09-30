import { Schema } from 'effect';

import { describe, expect, it } from 'vitest';

import { DateRange, LocalDate } from '#shared/valueObjects';

const date = (value: string) => Schema.decodeUnknownSync(LocalDate.schema)(value);
const range = (from: string, to: string) =>
  Schema.decodeUnknownSync(DateRange.schema)({ from, to });

describe('LocalDate', () => {
  it('accepts a calendar date and rejects impossible ones', () => {
    expect(Schema.decodeUnknownEither(LocalDate.schema)('2026-02-28')._tag).toBe('Right');
    expect(Schema.decodeUnknownEither(LocalDate.schema)('2026-02-30')._tag).toBe('Left');
    expect(Schema.decodeUnknownEither(LocalDate.schema)('2026-2-3')._tag).toBe('Left');
    expect(Schema.decodeUnknownEither(LocalDate.schema)('2026-02-28T10:00:00Z')._tag).toBe('Left');
  });

  it('adds days across months, years and leap days', () => {
    expect(LocalDate.addDays(date('2026-12-31'), 1)).toBe('2027-01-01');
    expect(LocalDate.addDays(date('2028-03-01'), -1)).toBe('2028-02-29');
    expect(LocalDate.daysBetween(date('2026-01-01'), date('2026-12-31'))).toBe(364);
  });
});

describe('DateRange', () => {
  it('accepts a one-day range', () => {
    expect(range('2026-08-01', '2026-08-01')).toEqual({ from: '2026-08-01', to: '2026-08-01' });
  });

  it('rejects a range that ends before it starts', () => {
    expect(
      Schema.decodeUnknownEither(DateRange.schema)({ from: '2026-08-02', to: '2026-08-01' })._tag,
    ).toBe('Left');
  });

  it('accepts exactly 366 days and rejects 367', () => {
    expect(range('2027-01-01', '2028-01-01')).toBeDefined(); // 366 days inclusive
    expect(
      Schema.decodeUnknownEither(DateRange.schema)({ from: '2027-01-01', to: '2028-01-02' })._tag,
    ).toBe('Left');
  });

  it('contains its own bounds', () => {
    const august = range('2026-08-01', '2026-08-31');
    expect(DateRange.checkContains(august, date('2026-08-01'))).toBe(true);
    expect(DateRange.checkContains(august, date('2026-08-31'))).toBe(true);
    expect(DateRange.checkContains(august, date('2026-09-01'))).toBe(false);
  });

  it('overlaps a range sharing a single day, not an adjacent one', () => {
    const august = range('2026-08-01', '2026-08-31');
    expect(DateRange.checkOverlaps(august, range('2026-08-31', '2026-09-05'))).toBe(true);
    expect(DateRange.checkOverlaps(august, range('2026-09-01', '2026-09-05'))).toBe(false);
  });
});
