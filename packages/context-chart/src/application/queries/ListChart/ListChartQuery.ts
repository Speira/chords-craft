import { Schema } from "effect";

import { TenantID } from "@speira/chordschart-shared/valueObjects";

export class ListChartQuery extends Schema.Class<ListChartQuery>("ListChartQuery")({
  tenantId: TenantID.schema,
}) {}
