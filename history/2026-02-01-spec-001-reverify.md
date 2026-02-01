# Spec 001 re-verification (2026-02-01)

Re-verified acceptance criteria for spec 001 (constants and networks):

- NetworkType enum (Mainnet, Testnet) in src/constants/networks.ts
- ChainId enum with ~30 chains, networks array with id/name/type, as const satisfies
- ercTokens array with USDC per chain, ercTokensBySymbolByChainId lookup in src/constants/coins.ts
- networksByChainId lookup

Unit tests (deno + vitest): all passed. Build: success.
