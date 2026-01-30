# Spec 001 re-verification: push blocked

**Date:** 2026-01-30

## Done

- Re-verified spec 001 (constants and networks): all acceptance criteria satisfied.
- Fixed unit test setup: Deno import map for `@tanstack/query-core`; vitest exclude `voltaire.spec.ts`; split `networks-normalize.ts` / `coins-normalize.ts` so Deno tests don’t load TanStack.
- Fixed e2e: wait for "Loading networks…" in demo test; use `data-testid` for From chain option in page test.
- All unit and e2e tests pass.
- Changes committed locally (re-verify spec 001 + test fixes).

## Blocked

- `git push` rejected (branch behind origin/main).
- `git pull --rebase origin main` hit conflicts (deno.json, deno.lock, package.json, specs, modify/delete on renamed specs).
- Push not completed; resolve rebase/conflicts manually or align with remote before pushing.
