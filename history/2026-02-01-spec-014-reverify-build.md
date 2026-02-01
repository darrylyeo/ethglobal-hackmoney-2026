# Spec 014 re-verification (build iteration)

**Date:** 2026-02-01

## Task

PROMPT_build: find highest-priority incomplete spec, implement, test, commit, DONE. All specs were already marked complete → Re-Verification Mode: pick one spec, re-verify all acceptance criteria.

Picked **spec 014 (E2E bridge flow)**.

## Implementation (BridgeFlow.svelte)

1. **data-testid="quote-result"** – Added to the routes list section so e2e can detect when routes are shown.
2. **data-error-display** – Added to the routes error block so e2e can find the error UI.
3. **data-no-routes** – Set on the same block when `error.code === ErrorCode.NO_ROUTES` so e2e can distinguish no-routes from other errors.
4. **Retry / Dismiss** – Added Retry (calls `onRefresh`) and Dismiss (clears `routesRow.error` via `bridgeRoutesCollection.update`) so e2e “routes error shows retry/dismiss” can find a button.
5. **Transaction history when connected** – Section now renders when `selectedActor` is set (not only when `transactions.length > 0`). Added a `<button>Transaction history</button>` (styled as heading) and “No transactions yet” when empty so e2e “transaction history section visible when connected” finds the button.

## E2E result

`pnpm run test:e2e` (via `node node_modules/@playwright/test/cli.js test`): 7 failed, 3 passed, 3 skipped.

All failures are the same: after clicking `[data-wallet-provider-option]`, `[data-wallet-address]` never appears (15s timeout). So the mock wallet connection never completes in the test environment. This matches existing history (2026-02-01-spec-014-reverify-partial.md, 2026-01-31-spec-014-e2e-blocked.md). Failures occur before any of the above UI is exercised.

## Exit

Spec 014 acceptance criteria are implemented in code; e2e cannot be verified because mock wallet connection is blocked. Exiting without DONE per constitution (“If blocked: explain in history/, exit without phrase”).
