import { Effect, Layer, pipe, Schema } from 'effect';

import { describe, expect, it, vi } from 'vitest';

import { Note, TenantID } from '@chordcraft/shared/valueObjects';

import {
  CreateChartCommand,
  CreateChartHandler,
} from '#context-chart/application/commands/CreateChart';
import { type ChartError, ChartProjection, ChartRepository } from '#context-chart/domain';
import { type Chart } from '#context-chart/domain/Chart';

describe('CreateChartHandler', () => {
  it('should create chart and save to repository and projection', async () => {
    const mockRepository = {
      save: vi.fn(() => Effect.void),
      load: vi.fn(),
    };

    const mockProjection = {
      upsert: vi.fn(() => Effect.void),
      findById: vi.fn(),
      findByTenant: vi.fn(),
      delete: vi.fn(),
    };

    const TestLayer = Layer.merge(
      Layer.succeed(ChartRepository, mockRepository),
      Layer.succeed(ChartProjection, mockProjection),
    );

    const command = {
      root: 'C',
      tenantId: TenantID.schema.make('tenant-1'),
      title: 'Test Chart',
      author: 'John Doe',
      structure: {
        Verse: {
          default: ['C', 'Am7', 'F', 'G'],
        },
      },
      plan: ['Verse'],
      links: [],
      tags: [],
    };

    const program = pipe(
      Schema.decodeUnknown(CreateChartCommand)(command),
      Effect.flatMap((data) => CreateChartHandler.execute(new CreateChartCommand(data))),
      Effect.provide(TestLayer),
    );

    const chart = await Effect.runPromise(program as Effect.Effect<Chart, ChartError, never>);

    expect(chart.title).toBe('Test Chart');
    expect(chart.root).toBe(Note.C);
    expect(chart.isActive).toBe(true);
    expect(mockRepository.save).toHaveBeenCalledOnce();
    expect(mockProjection.upsert).toHaveBeenCalledOnce();
  });
});
