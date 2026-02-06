# Re-verify spec 039 (E2E test hardening) – blocked

**Date:** 2026-02-06  
**Spec:** 039-e2e-test-hardening.md  
**Task:** PROMPT_build.md – execute one spec (no incomplete specs → re-verification).

## What was done

- Re-verified all 8 acceptance criteria in code:
  1. Single shared fixture: e2e/test-setup.ts + e2e/fixtures/tevm.ts; all e2e tests import from them.
  2. Network mocking: bridge-e2e, bridge, cctp-bridge, unified-bridge, tevm-execution, accessibility use test-setup/tevm.
  3. Core route happy-path: route-coverage.test.ts (/, /session#bridge, /coin/USDC, /rooms) + coverage-enforcement (coverage-manifest scenarios for all routes including /rooms/[roomId]).
  4. Error/empty per route: route-coverage empty/loading for USDC; coverage-enforcement join-disabled/join-enabled, peers-empty, not-found for coin, etc.
  5. Accessibility: accessibility.test.ts (axe) for home, bridge, transfers, rooms.
  6. Responsive: responsive.test.ts mobile + desktop for home, bridge, usdc, rooms.
  7. Trace/screenshot/video: playwright.e2e.config.ts trace on-first-retry, screenshot only-on-failure, video on-first-retry.
  8. Runtime: not confirmed (e2e did not complete).
- `deno task test:unit`: **44 Deno + 101 Vitest passed.**

## Block

- `deno task test:e2e`: fails with "Playwright requires Node.js 18.19 or higher to load esm modules" (Deno’s npm runner uses a Node that doesn’t meet that).
- `pnpx playwright test -c playwright.e2e.config.ts`: webServer (deno task build && deno task preview) times out after 240s and after 480s; build output appears but Playwright never sees the server as ready (GET http://localhost:4173/ never succeeds in time).

## Exit

Per PROMPT_build.md: blocked → explain in history/, exit without magic phrase.  
No commit. No `DONE`.

---

Re-run (same day): same outcome — unit 44 Deno + 101 Vitest passed; `deno task test:e2e` Node version error; `pnpx playwright test` webServer timeout 240s.
