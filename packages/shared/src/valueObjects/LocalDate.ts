// A calendar date with no time and no time zone (`2026-08-14`). ISO dates compare correctly as
// strings, which the range checks and the DynamoDB sort keys rely on.

import { Schema } from 'effect';

const PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function checkIsCalendarDate(value: string): boolean {
  if (!PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export const schema = Schema.String.pipe(
  Schema.filter(checkIsCalendarDate, { message: () => 'Expected a calendar date as YYYY-MM-DD' }),
  Schema.brand('LocalDate'),
);
export type LocalDate = typeof schema.Type;

export function addDays(date: LocalDate, days: number): LocalDate {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10) as LocalDate;
}

/** Whole days from `from` to `to`; 0 for the same day. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}
