import { Schema } from "effect";

import { ulid } from "ulid";

export const schema = Schema.String.pipe(Schema.brand("ChartID"));
export type ChartID = typeof schema.Type;

export const generate = () => ulid() as ChartID;
export const parse = (a: unknown) => Schema.decodeUnknown(schema)(a);
