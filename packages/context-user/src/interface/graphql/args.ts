/** GraphQL sends `null` for an omitted optional field; the domain schemas model absence. */
export function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => stripNulls(item));
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== null)
      .map(([key, item]) => [key, stripNulls(item)]),
  );
}

export function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...value } : {};
}
