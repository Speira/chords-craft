import { Schema } from "effect";

import { TenantID } from "@speira/chordschart-shared";

export class ListChartQuery extends Schema.Class<ListChartQuery>("ListChartQuery")({
  tenantId: TenantID,
}) {}
