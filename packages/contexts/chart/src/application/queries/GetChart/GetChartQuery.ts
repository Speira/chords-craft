import { Schema } from "effect";

import { TenantID } from "@speira/chordschart-shared";

import { ChartID } from "~/domain";

export class GetChartQuery extends Schema.Class<GetChartQuery>("GetChartQuery")({
  chartId: ChartID,
  tenantId: TenantID,
}) {}
