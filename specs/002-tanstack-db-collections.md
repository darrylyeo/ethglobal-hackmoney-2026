# Spec 002: TanStack DB collections

Collections to normalize chain and token data.

## Implementation

`src/lib/db/query-client.ts`:
- `queryClient`: shared `QueryClient` instance

`src/collections/networks.ts`:
- `normalizeNetwork(entry)`: identity transform `{ id, name }`
- `networksCollection`: TanStack DB collection from `networks` constant

`src/collections/coins.ts`:
- `normalizeCoin(entry)`: identity transform `{ chainId, address, symbol, decimals }`
- `coinsCollection`: TanStack DB collection from `ercTokens` constant

## Acceptance criteria

- [x] `queryClient` exported from `src/lib/db/query-client.ts`.
- [x] `networksCollection` in `src/collections/networks.ts`.
- [x] `coinsCollection` in `src/collections/coins.ts`.
- [x] Unit test `networks.spec.ts`: asserts `normalizeNetwork` output shape.
- [x] Unit test `coins.spec.ts`: asserts `normalizeCoin` output shape.

## Status

Complete.

## Output when complete

` DONE `
