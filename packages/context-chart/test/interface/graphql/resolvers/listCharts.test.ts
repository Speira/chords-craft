import { Effect, Layer } from 'effect';

import { Chord, Note, Section, TenantID } from '@chordcraft/shared/valueObjects';
import { describe, expect, it, vi } from 'vitest';

import { ChartID, ChartProjection, ChartReadError, ChartRepository } from '#context-chart/domain';
import { Chart } from '#context-chart/domain/Chart';
import { listCharts } from '#context-chart/interface/graphql/resolvers/listCharts';

describe('listCharts resolver', () => {
  describe('validation tests', () => {
    it('should reject missing required tenantId', async () => {
      const invalidInput = {
        tenantId: undefined,
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject empty tenantId', async () => {
      const invalidInput = {
        tenantId: '',
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject null tenantId', async () => {
      const invalidInput = {
        tenantId: null,
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject numeric tenantId', async () => {
      const invalidInput = {
        tenantId: 12345,
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject boolean tenantId', async () => {
      const invalidInput = {
        tenantId: true,
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject object as tenantId', async () => {
      const invalidInput = {
        tenantId: { id: 'tenant-123' },
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject array as tenantId', async () => {
      const invalidInput = {
        tenantId: ['tenant-1', 'tenant-2'],
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject tenantId that is too long', async () => {
      const invalidInput = {
        tenantId: 'A'.repeat(256),
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject tenantId with only whitespace', async () => {
      const invalidInput = {
        tenantId: '   ',
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should reject undefined input', async () => {
      await expect(listCharts(undefined)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should rethrow errors', async () => {
      const invalidInput = {
        tenantId: null,
      };
      await expect(listCharts(invalidInput)).rejects.toThrow();
    });

    it('should handle empty arguments object', async () => {
      await expect(listCharts({})).rejects.toThrow();
    });
  });

  // The handler's own logic is covered in test/application with mocked infra.
  // Here the resolver runs against the real handler with a mocked infrastructure
  // layer, verifying delegation and error propagation.
  describe('handler delegation', () => {
    const validInput = { tenantId: 'tenant-123' };

    const charts = [
      Chart.create({
        root: Note.A,
        id: ChartID.generate(),
        author: 'John Doe',
        tenantId: TenantID.schema.make('tenant-123'),
        title: 'Test Chart',
        structure: {
          [Section.Verse]: {
            default: [Chord.create({ root: Note.A })],
          },
        },
        plan: [Section.Verse],
        links: ['https://example.com'],
        tags: ['jazz'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    it('returns the charts found by the projection', async () => {
      const findByTenant = vi.fn(() => Effect.succeed(charts));
      const layer = Layer.merge(
        Layer.succeed(ChartProjection, {
          findByTenant,
          findById: vi.fn(),
          upsert: vi.fn(),
          delete: vi.fn(),
        }),
        Layer.succeed(ChartRepository, { save: vi.fn(), load: vi.fn() }),
      );

      await expect(listCharts(validInput, layer)).resolves.toBe(charts);
      expect(findByTenant).toHaveBeenCalledWith(validInput.tenantId);
    });

    it('rethrows projection failures', async () => {
      const layer = Layer.merge(
        Layer.succeed(ChartProjection, {
          findByTenant: vi.fn(() => Effect.fail(new ChartReadError({ reason: 'boom' }))),
          findById: vi.fn(),
          upsert: vi.fn(),
          delete: vi.fn(),
        }),
        Layer.succeed(ChartRepository, { save: vi.fn(), load: vi.fn() }),
      );

      await expect(listCharts(validInput, layer)).rejects.toThrow();
    });
  });
});
