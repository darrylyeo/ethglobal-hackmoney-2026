# Spec 001: Constants

Chain and token constants for USDC bridging.

## Implementation

`src/constants/networks.ts`:

- `NetworkType` enum: `Mainnet`, `Testnet`
- `ChainId` enum (~40 chains): Ethereum, Optimism, Polygon, Arbitrum, Avalanche,
  Celo, Base, Linea, ZkSyncEra, Unichain, Monad, Sonic, WorldChain, HyperEVM,
  Sei, Ink, Codex, Plume, XDC, Arc, plus testnets (Sepolia, Amoy, Fuji, etc.)
- `Network` type: `{ id: ChainId, name: string, type: NetworkType }`
- `networks` array with `as const satisfies readonly Network[]`
- `networksByChainId` lookup object

`src/constants/coins.ts`:

- `Erc20Token` type: `{ chainId, address, symbol, decimals }`
- `ercTokens` array: USDC for each chain with `as const satisfies`
- `ercTokensBySymbolByChainId` lookup: `chainId → symbol → token`

## Acceptance criteria

- [x] `NetworkType` enum with Mainnet/Testnet.
- [x] `ChainId` enum with LI.FI / Circle supported chains (mainnets and testnets).
- [x] `networks` array with id, name, and type for each chain.
- [x] `ercTokens` array with USDC address for each chain.
- [x] Lookup objects for quick access by chain ID.
- [x] Code style: tabs, no semicolons, `as const satisfies`.

## Status

Complete. ~40 chains with Mainnet/Testnet classification. Re-verification 2026-02-04: all 6 acceptance criteria confirmed in networks.ts and coins.ts (NetworkType, ChainId, networks, ercTokens, networksByChainId, ercTokensBySymbolByChainId); test:unit passed. Re-verification 2026-02-05 (PROMPT_build): same criteria re-checked; test:unit 41 Deno + 98 Vitest passed. Re-verification 2026-02-05 (PROMPT_build iteration): all 6 AC confirmed; test:unit 41 Deno + 101 Vitest passed.

## Output when complete

`DONE`
