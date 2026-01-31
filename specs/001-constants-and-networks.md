# Spec 001: Constants

Chain and token constants for USDC bridging.

## Implementation

`src/constants/networks.ts`:

- `ChainId` enum (9 chains): Ethereum, Optimism, Polygon, Arbitrum, Avalanche,
  Celo, Base, Linea, ZkSyncEra
- `Network` type: `{ id: ChainId, name: string }`
- `networks` array with `as const satisfies Network[]`
- `networksByChainId` lookup object

`src/constants/coins.ts`:

- `Erc20Token` type: `{ chainId, address, symbol, decimals }`
- `ercTokens` array: USDC for each chain with `as const satisfies`
- `ercTokensBySymbolByChainId` lookup: `chainId → symbol → token`

## Acceptance criteria

- [x] `ChainId` enum with 9 LI.FI / Circle supported chains.
- [x] `networks` array with id and name for each chain.
- [x] `ercTokens` array with USDC address for each chain.
- [x] Lookup objects for quick access by chain ID.
- [x] Code style: tabs, no semicolons, `as const satisfies`.

## Status

Complete.

## Output when complete

`DONE`
