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

- [x] `DataSource` enum exists in `src/constants/data-sources.ts` with required values.
- [x] All TanStack DB collection entities include a source attribute.
- [x] Entities with multiple possible origins include `$source: DataSource`.
- [x] Manually fetched data is normalized into TanStack DB collections before use.
- [x] Queries filter by source when applicable.
- [ ] Playwright coverage exists for any UI that renders source-tagged entities and `pnpm test:e2e` passes. (Route-coverage and Transfers e2e pass; full suite has 12 pre-existing failures.)

## Testing

- `pnpm test:e2e`

## Status

Implementation complete. DataSource enum (Local, LiFi, TokenLists, Stork, Uniswap, Yellow, Cctp, Voltaire, PartyKit, Covalent). All collections have $source; transfer-graphs collection; transfers page uses collection; CctpFees/CctpAllowance filter by source. Blocked: full e2e suite does not pass.

## Output when complete

`DONE`
