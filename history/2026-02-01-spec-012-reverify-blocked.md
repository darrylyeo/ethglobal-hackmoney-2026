# Spec 012 re-verification (blocked)

All specs marked Complete; re-verification mode per constitution.

**Spec 012: Testnet/Mainnet filtering**

- Re-verified acceptance criteria against code.
- **Regression fixed:** Balances grid was showing all chains from collection; spec requires "Balances grid shows only chains matching toggle". Updated `Balances.svelte` to filter displayed balances by `filteredNetworks` (chainId in filtered list).
- Unit tests: pass.
- E2E: tests that cover 012 (testnet/mainnet toggle in `e2e/bridge-e2e.test.ts`) never reach the toggle — they fail at "connect mock wallet" because `[data-wallet-address]` never appears after clicking provider option (pre-existing; see 2026-01-31-spec-014-e2e-blocked.md and related).

Exit without DONE: e2e not fully verifiable.
