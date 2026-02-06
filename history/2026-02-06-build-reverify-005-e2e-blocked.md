# Re-verify spec 005 (Wallet provider & balances) – e2e blocked

**Date:** 2026-02-06  
**Spec:** 005-wallet-provider-balances.md  
**Task:** PROMPT_build.md – execute one spec (no incomplete specs → re-verification).

## What was done

- Re-verified all 17 acceptance criteria in code:
  - **Wallet:** `AccountsSelect.svelte` in `src/views/`, TanStack DB (walletsCollection, walletConnectionsCollection), multi-wallet, bridgeSettingsState, EIP-6963 connect, address + disconnect.
  - **Collections:** `actors.ts` (Actor, actorsCollection), `actor-coins.ts` (ActorCoin, actorCoinsCollection), `fetchActorCoinBalance`, `fetchAllBalancesForAddress`.
  - **Bridge:** `src/routes/session/Bridge.svelte` uses AccountsSelect + CoinBalances, balances fetched on connect (CoinBalances.svelte calls fetchAllBalancesForAddress when selectedActor set), grid with chain/amount, loading and per-chain errors.
  - **E2E:** `e2e/wallet.test.ts` exists with network toggle, wallet menu (connect popover), address in header, balances section (tevm wallet); selectors and flow match spec.
- `pnpm test:unit`: **44 Deno + 101 Vitest passed.**

## Block

- `deno task test:e2e`: Playwright "Node.js 18.19 or higher" error (Deno npm runner).
- `npx playwright test -c playwright.e2e.config.ts e2e/wallet.test.ts`: webServer (build + preview) runs but test run timed out before completion (same pattern as 039).

## Exit

Per PROMPT_build.md: blocked → explain in history/, exit without phrase.  
No commit. No `DONE`.
