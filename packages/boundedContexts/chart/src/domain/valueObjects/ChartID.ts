import { Schema } from "effect";

import { ulid } from "ulid";

export const ChartID = Schema.String.pipe(Schema.brand("ChartID"));
export type ChartID = typeof ChartID.Type;

export const generateChartId = () => ulid() as ChartID;
export const parse = (a: unknown) => Schema.decodeUnknown(ChartID)(a);
