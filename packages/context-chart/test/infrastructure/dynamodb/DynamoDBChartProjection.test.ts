import { Effect } from 'effect';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ChartReadError } from '#context-chart/domain/errors';
import { ChartID } from '#context-chart/domain/valueObjects';
import { DynamoDBChartProjection } from '#context-chart/infrastructure/dynamodb/DynamoDBChartProjection';

import {
  createProjectionTable,
  createTestClient,
  deleteTable,
  makeChart,
  PROJECTION_TABLE,
} from './helpers';

describe('DynamoDBChartProjection', () => {
  const client = createTestClient();
  const projection = new DynamoDBChartProjection(client);

  beforeAll(async () => {
    await createProjectionTable(client);
  });

  afterAll(async () => {
    await deleteTable(client, PROJECTION_TABLE);
  });

  it('upserts a chart and retrieves it by id', async () => {
    const chart = makeChart();

    await Effect.runPromise(projection.upsert(chart));
    const found = await Effect.runPromise(projection.findById(chart.id, chart.tenantId));

    expect(found.id).toBe(chart.id);
    expect(found.title).toBe(chart.title);
    expect(found.tenantId).toBe(chart.tenantId);
  });

  it('upserts a chart and retrieves it by tenant', async () => {
    const tenantId = 'tenant-findByTenant';
    const chart1 = makeChart(ChartID.generate(), tenantId);
    const chart2 = makeChart(ChartID.generate(), tenantId);

    await Effect.runPromise(Effect.all([projection.upsert(chart1), projection.upsert(chart2)]));
    const charts = await Effect.runPromise(projection.findByTenant(tenantId));

    expect(charts).toHaveLength(2);
    const ids = charts.map((c) => c.id);
    expect(ids).toContain(chart1.id);
    expect(ids).toContain(chart2.id);
  });

  it('findByTenant leaves archived charts out, findAllByTenant keeps them', async () => {
    const tenantId = 'tenant-archived';
    const active = makeChart(ChartID.generate(), tenantId, { title: 'Active' });
    const archived = makeChart(ChartID.generate(), tenantId, {
      title: 'Archived',
      isActive: false,
    });

    await Effect.runPromise(Effect.all([projection.upsert(active), projection.upsert(archived)]));

    const visible = await Effect.runPromise(projection.findByTenant(tenantId));
    expect(visible.map((c) => c.id)).toEqual([active.id]);

    const all = await Effect.runPromise(projection.findAllByTenant(tenantId));
    expect(all.map((c) => c.id).sort()).toEqual([active.id, archived.id].sort());
  });

  it('findByTenant returns the most recently updated chart first', async () => {
    const tenantId = 'tenant-ordering';
    const oldest = makeChart(ChartID.generate(), tenantId, {
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    const newest = makeChart(ChartID.generate(), tenantId, {
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    });
    const middle = makeChart(ChartID.generate(), tenantId, {
      updatedAt: new Date('2024-03-01T00:00:00.000Z'),
    });

    await Effect.runPromise(
      Effect.all([projection.upsert(oldest), projection.upsert(newest), projection.upsert(middle)]),
    );

    const charts = await Effect.runPromise(projection.findByTenant(tenantId));
    expect(charts.map((c) => c.id)).toEqual([newest.id, middle.id, oldest.id]);
  });

  it('findByTenant pages past the 1MB query limit', async () => {
    const tenantId = 'tenant-pagination';
    // Each chart carries ~40KB of tags, so 40 of them exceed the 1MB a single Query returns.
    const padding = Array.from({ length: 40 }, () => 'x'.repeat(1024));
    const charts = Array.from({ length: 40 }, (_, index) =>
      makeChart(ChartID.generate(), tenantId, {
        tags: padding,
        updatedAt: new Date(Date.UTC(2024, 0, index + 1)),
      }),
    );

    await Effect.runPromise(
      Effect.all(
        charts.map((chart) => projection.upsert(chart)),
        { concurrency: 10 },
      ),
    );

    const found = await Effect.runPromise(projection.findByTenant(tenantId));
    expect(found).toHaveLength(charts.length);
  });

  it('deletes a chart and findById returns a ChartReadError', async () => {
    const chart = makeChart();

    await Effect.runPromise(projection.upsert(chart));
    await Effect.runPromise(projection.delete(chart));

    const result = await Effect.runPromise(
      projection.findById(chart.id, chart.tenantId).pipe(Effect.either),
    );

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(ChartReadError);
    }
  });
});
