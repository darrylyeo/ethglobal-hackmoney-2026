# Spec 039: E2E test hardening across the codebase

Improve end-to-end test reliability, coverage, and developer ergonomics across
all critical user flows (bridge, wallets, transfers, rooms, and accessibility)
while reducing flakiness and runtime.

## Goals

- Consistent test setup with a single helper entrypoint
- Deterministic mocks for wallets, LI.FI, Voltaire, and PartyKit
- Coverage for top-level routes and critical user actions
- Stable selectors and accessibility-first locators
- Clear failure diagnostics and artifacts for CI

## Scope

- Playwright E2E tests in `e2e/`
- Shared test fixtures and mocks
- Route coverage: `/`, `/bridge`, `/transfers`, `/rooms`, `/rooms/[roomId]`
- Cross-cutting checks: accessibility, responsiveness, and error states

## Non-goals

- Rewriting core product logic
- Converting E2E tests to unit tests
- Adding a new test runner

## Requirements

### Test setup

- Single `e2e/test-setup.ts` fixture for:
  - Base URL and storage state
  - Wallet provider mock (EIP-6963 + window.ethereum)
  - Network mocking for LI.FI, Voltaire, and PartyKit
  - Default test data for chains, tokens, balances, and routes
- Per-suite overrides via small fixture extension files
- Avoid global state mutation between tests

### Reliability and determinism

- All network calls mocked or controlled
- No fixed sleeps; rely on locators and explicit state assertions
- Stable selectors via semantic roles and labels
- Snapshot assertions only for stable, intentionally designed UI

### Coverage

- Home page: navigation, key CTAs, and rendering without errors
- Bridge flow: connect, balance view, route fetch, approval gating, status UI
- Transfers: initial state, empty state, and loading/error paths
- Rooms: create/join flow, message list rendering, error states
- Accessibility smoke test per route (axe or role-based checks)
- Responsive checks for at least two breakpoints per core route

### Diagnostics

- Trace, screenshot, and video on failure
- Console error capture and surfacing in test output
- Network request log for mocked endpoints

## Acceptance criteria

- [x] All E2E tests run with a single shared fixture entrypoint
- [x] Network mocking eliminates flaky external dependencies
- [x] Each core route has at least one happy-path E2E test
- [x] Each core route has at least one error or empty-state test
- [x] Accessibility smoke tests pass for all core routes
- [x] Responsive checks cover mobile and desktop breakpoints
- [x] Test failures include trace + screenshot + console errors
- [x] Total E2E runtime stays within current CI budget

## TODO

- [x] Inventory existing E2E tests and map to routes
- [x] Create shared fixture and migrate tests
- [x] Add network mocks for LI.FI, Voltaire, PartyKit
- [x] Implement route-level coverage gaps
- [x] Add accessibility + responsive smoke tests
- [x] Add failure diagnostics and logs

## Testing

```bash
pnpm test:e2e
```

## Status

Complete. Single fixture in `e2e/test-setup.ts`: `addMockWallet`, `injectMockWalletInPage`, `addLifiRoutesMock`, `addCctpMocks`, `addNetworkMocks`. Wallet mock injected via `page.evaluate` after goto so EIP-6963 announce is received in page context. Route-coverage: Home nav uses `.first()` for duplicate links; Transfers asserts `#main-content`-scoped period/loading text. All e2e tests pass. Playwright config: trace on-first-retry, screenshot only-on-failure, video on-first-retry.

## Output when complete

`DONE`
