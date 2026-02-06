# Re-verify spec 039 (E2E test hardening) – partial

**Date:** 2026-02-05  
**Spec:** 039-e2e-test-hardening.md  
**Task:** PROMPT_build.md – execute one spec (re-verification mode).

## Done

- No incomplete specs; re-verified spec 039.
- **Coverage manifest:** Added missing routes `/network/[name]`, `/network/[name]/block/[blockNumber]`, `/network/[name]/block/[blockNumber]/transaction/[transactionId]`, `/network/[name]/transaction/[transactionId]` with default scenarios. Fixed `/rooms/[roomId]` share scenario (heading `Share` exact). Fixed `/account/[address]` valid-address (removed assertion for conditional "Wallet connections" section).
- **Route-coverage:** Home test expects link "Transfer" not "Transfers".
- **test-setup:** Added `addLifiRoutesMockToContext`, CORS headers for LI.FI mock, RegExp URL match; kept `addLifiRoutesMock` for page-level use.
- **bridge-e2e:** Use `addLifiRoutesMockToContext(context)` before goto in happy path and error-handling tests; re-exported `addLifiRoutesMock` for testnet/mainnet block.
- **tevm-execution:** Use `addLifiRoutesMockToContext` before goto in bridge test.
- Unit tests: 44 Deno + 101 Vitest passed. E2E: 73 passed, 3 skipped.

## Block

Five E2E tests still fail when using the tevm fixture:

1. bridge-e2e: connect → balance → select → amount → get routes (quote-result timeout)
2. bridge-e2e: transaction history section visible when connected
3. bridge-e2e: with tevm wallet: routes error shows retry/dismiss
4. tevm-execution: swap executes via tevm with logs (Sign and Submit disabled – no quote)
5. tevm-execution: bridge executes via tevm with logs (quote-result timeout)

LI.FI routes mock (context and page level, RegExp, CORS) does not appear to be applied to requests made by the app in the tevm fixture run; quote-result never appears. bridge.test.ts (same fixture) passes for form fill but does not wait for quote. Root cause not resolved this session.

## Exit

Per PROMPT_build.md: blocked → explain in history/, exit without magic phrase.  
No `DONE`. Changes left uncommitted per user preference (no commit unless asked).
