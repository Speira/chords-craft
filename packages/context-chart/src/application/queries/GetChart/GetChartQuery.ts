import { Schema } from 'effect';

import { TenantID } from '@chordcraft/shared/valueObjects';

import { ChartID } from '#context-chart/domain';

export class GetChartQuery extends Schema.Class<GetChartQuery>('GetChartQuery')({
  chartId: ChartID.schema,
  tenantId: TenantID.schema,
}) {}
