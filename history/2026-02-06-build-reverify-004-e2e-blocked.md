# PROMPT_build: execute one spec, re-verify 004 (e2e blocked)

- **Spec:** 004 Bridge UI (re-verification; no incomplete specs found).
- **Done:** All 14 acceptance criteria verified in code (BridgeFlow, AccountsSelect, CoinBalances, TokenApproval, BridgeExecution, Bits UI, bridgeRoutesCollection, e2e/bridge.test.ts). Unit tests: 44 Deno + 101 Vitest passed. Spec status updated; commit pushed.
- **Blocked:** E2E not run to completion. `deno task test:e2e` fails with "Playwright requires Node.js 18.19 or higher" when run via Deno. `pnpx playwright test -c playwright.e2e.config.ts` uses system Node but timed out during build/preview. Exiting without DONE per PROMPT_build (if blocked: explain in history/, exit without phrase).
