# Build re-verify: spec 001 (2026-02-02)

Per PROMPT_build.md: all specs complete → re-verification mode.

**Spec:** 001 Constants and networks.

**Re-verification:**
- `src/constants/networks.ts`: NetworkType (Mainnet/Testnet), ChainId (~40 chains), Network type, networks (from networkConfigs), networksByChainId ✓
- `src/constants/coins.ts`: Erc20Token type, ercTokens with `as const satisfies`, ercTokensBySymbolByChainId ✓
- Code style: tabs, no semicolons ✓

**Tests:** `pnpm test:unit` (37 deno + 90 vitest passed), `pnpm test:e2e` (39 passed, 4 skipped). No regressions.
