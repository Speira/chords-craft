// An inclusive range of whole days. The span cap is what lets a store find every range
// covering a date with one bounded query: such a range starts at most MAX_SPAN_DAYS - 1 days
// before it.

import { Schema } from 'effect';

import * as LocalDate from './LocalDate';

export const MAX_SPAN_DAYS = 366;

export const schema = Schema.Struct({ from: LocalDate.schema, to: LocalDate.schema }).pipe(
  Schema.filter((range) => range.from <= range.to, {
    message: () => '`from` must not be after `to`',
  }),
  Schema.filter((range) => LocalDate.daysBetween(range.from, range.to) < MAX_SPAN_DAYS, {
    message: () => `A range covers at most ${MAX_SPAN_DAYS} days`,
  }),
);
export type DateRange = typeof schema.Type;

export const checkContains = (range: DateRange, date: LocalDate.LocalDate) =>
  range.from <= date && date <= range.to;

export const checkOverlaps = (a: DateRange, b: DateRange) => a.from <= b.to && b.from <= a.to;
