# Re-verify spec 039 (E2E test hardening) – blocked

**Date:** 2026-02-05  
**Spec:** 039-e2e-test-hardening.md  
**Task:** PROMPT_build.md – execute one spec (re-verification mode).

## What was done

- Confirmed spec 039 acceptance criteria and fixture (e2e/test-setup.ts: addMockWallet, injectMockWalletInPage, addLifiRoutesMock, addCctpMocks, addNetworkMocks).
- Added trace/screenshot/video to `playwright.e2e.config.ts` to match spec diagnostics.
- Ran `deno task test:e2e`.

## Block

E2E fails: root route `/` never leaves the layout Boundary pending state. The main content shows "Loading..." in both SSR HTML and in the browser; the heading "USDC Tools" and `#main h1` never appear within 30s. So:

- Home scenario (`/ :: default`), route-coverage Home test, and accessibility "home page" test all fail (locator `#main h1` or heading not found).
- `expect(page.getByText('Loading...')).toBeHidden({ timeout: 30_000 })` also times out – Loading stays visible.

Conclusion: In the E2E/Playwright environment the root layout’s `<Boundary>` around `{@render children()}` never resolves, so the root page content is not rendered. Cause is likely SvelteKit/layout async behavior or environment (e.g. hydration/load) in the test runner; not addressed in this session.

## Unchanged

- e2e/test-setup.ts and route/accessibility/responsive test structure left as-is.
- Reverted temporary changes to coverage-manifest and accessibility/route-coverage that waited for Loading to hide.

## Exit

Per PROMPT_build.md: blocked → explain in history/, exit without magic phrase.  
**No commit.** No `DONE`.
