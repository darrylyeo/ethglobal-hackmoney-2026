# Spec 014 re-verification blocked (2026-02-01)

Re-verification of spec 014 (E2E bridge flow) found 5 of 6 E2E tests failing: after clicking the mock wallet provider option, `[data-wallet-address]` never becomes visible (timeout 15s).

Findings:
- "Without wallet: clear message and connect prompt" passes.
- All tests that require connecting the mock wallet fail at the same step: `[data-wallet-address]` not found after click.
- Adding a direct hook `window.__requestWalletConnection({ rdns: 'com.mock' })` and calling it from the test: the call **succeeds** (no throw, result.ok true), but the UI still does not show the address. So the connection completes (setConnectionConnected runs) but the DOM does not update.
- Conclusion: mock wallet connection and collection update work when invoked from the page; the failure is either (1) the menu item click/onSelect not firing the connect handler, or (2) TanStack DB / Svelte reactivity not updating the DOM when the collection is updated from the test flow (e.g. timing or subscription not firing in the test environment).

Attempted fixes (no success):
- Bits UI DropdownMenu.Item: switched from `onclick` to `onSelect` and to `onSelect` + `setTimeout(..., 0)`.
- Playwright: click via `getByRole('menuitem', { name: 'Mock Wallet' })` instead of `[data-wallet-provider-option]`.
- Mock provider: explicit `Promise.resolve(...)` return.

Reverted: temporary hook test, `window.__requestWalletConnection`, and related debug changes. Left: mock `Promise.resolve` in e2e, `data-wallet-connecting` on connecting chip, menuitem click in tests (can be reverted to locator if preferred).

**Re-check (same session):** Ran `node node_modules/@playwright/test/cli.js test --config=playwright.e2e.config.ts`. 7 failed (same step: `[data-wallet-address]` timeout 15s after clicking provider option), 3 passed (wallet network toggle, connect popover, without-wallet prompt). Build succeeds; E2E that require mock connect still blocked.

Exit without DONE per PROMPT_build.md (blocked).
