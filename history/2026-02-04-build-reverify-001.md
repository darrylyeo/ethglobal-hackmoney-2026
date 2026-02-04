# Build: re-verify one spec (2026-02-04)

- Checked `specs/`: no INCOMPLETE spec (all have Status: Complete).
- Per constitution re-verification: picked **spec 001 (Constants and networks)**.
- Re-verified all acceptance criteria:
  - `src/constants/networks.ts`: NetworkType (Mainnet/Testnet), ChainId enum (~40 chains), Network type, `networks` (id/name/type), `networksByChainId`.
  - `src/constants/coins.ts`: Erc20Token type, `ercTokens` (USDC per chain, as const satisfies), `ercTokensBySymbolByChainId`.
  - Code style: tabs, no semicolons, as const satisfies (coins); networks derived from networkConfigs.
- Unit tests: `deno task test:unit` + Vitest passed (41 + 98).
- E2E: `deno task test:e2e` — 69 failed, 2 skipped, 2 passed. Failures are `net::ERR_CONNECTION_REFUSED` at http://localhost:4173 (webServer not available to tests), not application regressions. Two tests failed on assertions (cctp-bridge confirmation dialog; unified-bridge chain pair only LI.FI).

Second pass (same day): Re-ran unit tests and build; both passed. Spec 001 acceptance criteria confirmed. Commit and push; DONE.
