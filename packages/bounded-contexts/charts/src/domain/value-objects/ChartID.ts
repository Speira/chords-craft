import { Schema } from "effect";
import { ulid } from "ulid";

export const ChartID = Schema.String.pipe(Schema.brand("ChartID"));
export type ChartID = typeof ChartID.Type;

export const generateChartUid = () => ulid() as ChartID;
