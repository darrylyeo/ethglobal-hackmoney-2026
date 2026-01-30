# Spec 001: Constants and networks

Define chain and token constants for USDC bridging. One `.ts` file per entity type: enum as ID, mapping object for values. USDC on all LI.FI / Circle supported chains.

## Acceptance criteria

- [ ] `src/lib/constants/networks.ts` exists: `Network` enum (chain IDs) and `networks` mapping (e.g. `name`).
- [ ] `src/lib/constants/tokens.ts` (or equivalent) exists: token enum + mapping; USDC included for each supported chain.
- [ ] Supported chains match LI.FI / Circle USDC coverage (no arbitrary subset).
- [ ] Code style: tabs, no semicolons, enum-as-ID + mapping pattern only (no standalone const objects for the same concept).
- [ ] No ethers/viem; Voltaire not required in this spec, only type/constant shape.

## Status

Incomplete.

## Output when complete

` DONE `
