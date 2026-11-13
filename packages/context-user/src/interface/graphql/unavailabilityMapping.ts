import type { Unavailability } from '#context-user/domain';

export interface UnavailabilityView {
  id: string;
  from: string;
  to: string;
  reason: string | null;
  appliesToAllBands: boolean;
  bandIds: ReadonlyArray<string>;
}

/** The flat GraphQL input, in the domain's shape; the command's schema validates the result. */
export function toUnavailabilityFields(input: Record<string, unknown>): Record<string, unknown> {
  const { bandIds, from, reason, to } = input;
  const hasBands = Array.isArray(bandIds) && bandIds.length > 0;
  return {
    range: { from, to },
    ...(reason === undefined ? {} : { reason }),
    scope: hasBands ? { bandIds } : 'ALL',
  };
}

export function toUnavailabilityView(entry: Unavailability): UnavailabilityView {
  return {
    id: entry.id,
    from: entry.range.from,
    to: entry.range.to,
    reason: entry.reason ?? null,
    appliesToAllBands: entry.scope === 'ALL',
    bandIds: entry.scope === 'ALL' ? [] : entry.scope.bandIds,
  };
}
