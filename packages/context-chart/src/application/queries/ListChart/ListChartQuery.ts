import { Schema } from 'effect';

import { TenantID } from '@chordcraft/shared/valueObjects';

export class ListChartQuery extends Schema.Class<ListChartQuery>('ListChartQuery')({
  tenantId: TenantID.schema,
}) {}
