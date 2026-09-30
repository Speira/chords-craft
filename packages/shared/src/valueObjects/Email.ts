import { Schema } from 'effect';

const PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Normalized = Schema.transform(Schema.String, Schema.String, {
  strict: true,
  decode: (value) => value.trim().toLowerCase(),
  encode: (value) => value,
});

const Checked = Schema.String.pipe(
  Schema.maxLength(254),
  Schema.pattern(PATTERN, { message: () => 'Expected an email address' }),
  Schema.brand('Email'),
);

/** Trimmed and lowercased before it is checked, so one address has one spelling. */
export const schema = Schema.compose(Normalized, Checked);
export type Email = typeof schema.Type;
