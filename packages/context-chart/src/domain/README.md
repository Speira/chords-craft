# The domain of the charts context

Pure logic: no AWS, no Effect layers, no I/O. It contains:

- **Entity**: `Chart.ts` — `create`, `update`, `parse`, `toRecord`.
- **Aggregate**: `ChartAggregate.ts` — validates commands, emits events, and rebuilds a
  chart from its history with `fromEvents`.
- **Value objects** (`valueObjects/`): `ChartID`, and `Chart.schema.ts` — the Effect Schema
  for a chart. The musical value objects (`Chord`, `Note`, `Structure`, `Section`, `Scale`,
  `TenantID`, …) live in `@chordcraft/shared`, because the client needs them too.
- **Events** (`events/`): `ChartCreated`, `ChartUpdated`, `ChartArchived`. All three are
  folded on replay; only `ChartCreated` and `ChartArchived` are emitted today.
- **Errors** (`errors/`): `ChartValidationError`, `ChartNotFound`, `InvalidStructure`,
  `InvalidRoot`, `InvalidPlan`, `ChartReadError`, `ChartWriteError`, `ChartParseError` —
  tagged errors, returned in the `Effect` error channel rather than thrown.
- **Interfaces**: `ChartRepository.ts` (event store) and `ChartProjection.ts` (read model).
  The infrastructure layer supplies the DynamoDB implementations.
