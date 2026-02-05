# Build re-verify Spec 002 – E2E blocked

- **Date:** 2026-02-05
- **Mode:** PROMPT_build (one spec, re-verification)

## Done

- All specs complete; re-verification mode. Picked Spec 002 (TanStack DB collections).
- Verified all 11 acceptance criteria in code: `queryClient` in `src/lib/db/query-client.ts`; `networksCollection`, `coinsCollection`, `walletsCollection`, `walletConnectionsCollection`, `actorsCollection`, `actorCoinsCollection`, `actorAllowancesCollection`, `bridgeRoutesCollection`, `transactionsCollection` in respective files; unit tests for normalizers: `networks.spec.ts`, `coins.spec.ts`, `actors.spec.ts`, `actor-coins.spec.ts` exist (networks/coins specs cannot run under Deno due to `@tanstack/svelte-db` import resolution; actors/actor-coins run in test:unit).
- `deno task test:unit` passed (41 Deno + 98 Vitest).

## Blocked

- E2E: `deno task test:e2e` ran; accessibility and other tests failed (timeouts waiting for `#main` / heading). Same class of issue as 2026-02-04 (layout boundary or async content not resolving in Playwright). No commit/push; no DONE.
