import { Schema } from "effect";

import { isValid, ulid } from "ulid";

export const schema = Schema.String.pipe(
  Schema.filter((s) => isValid(s), { message: () => "Expected a valid ULID" }),
  Schema.brand("ChartID"),
);
export type ChartID = typeof schema.Type;

export const generate = () => ulid() as ChartID;
export const parse = (a: unknown) => Schema.decodeUnknown(schema)(a);
