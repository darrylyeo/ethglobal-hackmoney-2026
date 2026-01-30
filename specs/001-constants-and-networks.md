# Spec 001: Constants and networks

Define chain and token constants for USDC bridging. One `.ts` file per entity type in `src/constants`: enum as ID, mapping object with `as const satisfies`. USDC on all LI.FI / Circle supported chains.

## Acceptance criteria

- [x] `src/constants/networks.ts` exists: `Network` enum (chain IDs) and `networks` mapping (e.g. `name`) with `as const satisfies`.
- [x] `src/constants/tokens.ts` (or equivalent) exists: `Token` enum + mapping; USDC included for each supported chain, mapping with `as const satisfies`.
- [x] Supported chains match LI.FI / Circle USDC coverage (no arbitrary subset).
- [x] Code style: tabs, no semicolons; enum-as-ID + mapping pattern only, mappings use `as const satisfies`.
- [x] No ethers/viem; Voltaire not required in this spec, only type/constant shape.

## Status

Complete.

## Output when complete

` DONE `
