# Spec 042: Entity data sources

All TanStack DB entities are attributable to a data source. Fetched data is
normalized into collections, and queries filter by source where applicable.

## Implementation

### DataSource enum

`src/constants/data-sources.ts`:

- `enum DataSource` with at least:
	- `Local` (constants)
	- `LiFi`
	- `TokenLists`
	- `Stork`
- Add additional entries for every external data source in use (CCTP, ETH JSON-RPC,
  Uniswap, Yellow, etc.) as needed.

### Collection entities

- All TanStack DB collection entities must include a source attribute.
- Entities that can originate from multiple sources include:
	- `$source: DataSource`

### Normalization

- Manually fetched data is mapped into TanStack DB collections via explicit
  normalizers instead of being used directly in components.
- Collection rows include source attribution when inserted or updated.

### Queries

- TanStack DB queries filter by source when a collection contains multiple
  sources or source-specific behavior.

## Acceptance criteria

- [ ] `DataSource` enum exists in `src/constants/data-sources.ts` with required values.
- [ ] All TanStack DB collection entities include a source attribute.
- [ ] Entities with multiple possible origins include `$source: DataSource`.
- [ ] Manually fetched data is normalized into TanStack DB collections before use.
- [ ] Queries filter by source when applicable.
- [ ] Playwright coverage exists for any UI that renders source-tagged entities and `pnpm test:e2e` passes.

## Testing

- `pnpm test:e2e`

## TODOs

- TODO: List current external sources to ensure enum coverage.
- TODO: Inventory manual fetches that should be normalized into collections.
- TODO: Identify UI surfaces that need e2e coverage for source-tagged data.

## Status

Proposed.

## Output when complete

`DONE`
