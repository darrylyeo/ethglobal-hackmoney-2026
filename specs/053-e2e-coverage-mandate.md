# Spec 053: Enforce 100% E2E coverage for all pages and branches

Mandate and enforce complete end-to-end coverage across every SvelteKit route
(+page.svelte) and the explicit UI branches for each route.

## Goals

- 100% E2E coverage across all app pages (every +page.svelte route)
- Explicit branch coverage per route (happy/alt state, hash variants, and
  data-backed variants)
- Deterministic, seedable E2E scenarios for each branch
- Automated enforcement that fails if any route/branch is missing coverage

## Scope

- Playwright E2E tests in `e2e/`
- Route discovery from `src/routes/**/+page.svelte`
- A coverage manifest mapping routes to required branches and scenarios
- Deterministic seeding (localStorage) for data-backed branches

## Non-goals

- Replacing unit or integration tests
- Adding a new test runner
- Coverage of non-route components unless required to validate branches

## Requirements

### Coverage definition

- Each SvelteKit route (+page.svelte) must appear in a coverage manifest.
- Each route must declare its required branches (state variants) explicitly.
- Every declared branch must have a deterministic E2E scenario.

### Enforcement

- Add a Playwright test that:
  - Discovers all routes from `src/routes/**/+page.svelte`.
  - Fails if any route is missing from the manifest.
  - Fails if any manifest route is unknown or any branch is missing a scenario.

### Deterministic setup

- Provide helpers to seed localStorage-backed collections for E2E.
- Use hash/query state to drive route-level branches when supported.
- Avoid flakiness: no fixed sleeps; use explicit assertions.

## Acceptance criteria

- [x] All routes in `src/routes/**/+page.svelte` are covered by the manifest.
- [x] Each route declares explicit branch coverage (default + any variants).
- [x] Each branch has a deterministic E2E scenario and assertion.
- [x] Enforcement test fails on missing/extra routes or branches.
- [x] `deno task test:e2e` passes with the new coverage suite.

## Testing

```bash
deno task test:e2e
```

## Status

Complete. Coverage manifest in `e2e/coverage-manifest.ts` with `routeBranchRequirements` and `coverageScenarios`; enforcement test in `e2e/coverage-enforcement.test.ts` discovers routes via `e2e/coverage-utils.ts`, asserts manifest match and branch coverage, runs each scenario. Helpers in `e2e/coverage-helpers.ts` for localStorage seeding (page-based seed for session data). Re-verification 2026-02-05 (PROMPT_build execute one spec): added missing routes `/coin/[symbol]`, `/transfers`, `/wallets` to manifest with branches and scenarios; fixed home scenario (Transfer not Transfers), account valid-address (Balances exact), explore/usdc assertions; all 37 coverage enforcement tests pass.

## Output when complete

`DONE`
