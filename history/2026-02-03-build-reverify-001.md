# Build re-verify: spec 001 (2026-02-03)

- All specs in `specs/` marked Complete; no INCOMPLETE spec.
- Re-verification: spec 001 (Constants and networks).
- Acceptance criteria: NetworkType enum, ChainId enum, networks array, networksByChainId, ercTokens, ercTokensBySymbolByChainId, code style — all satisfied in `src/constants/networks.ts` and `src/constants/coins.ts`.
- Tests: `pnpm test:unit` (37 Deno + 90 Vitest), `pnpm test:e2e` (38 passed, 5 skipped).
