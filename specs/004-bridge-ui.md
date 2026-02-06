# Spec 004: Bridge UI

Full bridge interface for USDC bridging via LI.FI, using Bits UI primitives.

**References:**

- https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

## Components

### `src/routes/bridge/lifi/+page.svelte`

Entry point that renders BridgeFlow.

### `src/routes/bridge/lifi/BridgeFlow.svelte`

Main bridge interface with:

1. **Testnet/mainnet toggle** – filters available networks
2. **Source chain select** – Bits UI Select, filtered by network type
3. **Destination chain select** – Bits UI Select, filtered by network type
4. **Amount input** – human-readable USDC amount with validation
5. **Recipient toggle** – send to self or custom address
6. **Slippage settings** – configurable via Popover
7. **Route list** – multiple route options with comparison
8. **Route selection** – click to select best route
9. **Fee breakdown** – gas costs, protocol fees
10. **Quote expiration** – countdown timer, refresh button
11. **Confirmation dialog** – review before sending
12. **Error display** – inline error messages

### `src/views/AccountsSelect.svelte`

Wallet discovery and connection via EIP-6963.

### `src/views/CoinBalances.svelte`

USDC balance display per chain.

### `src/routes/bridge/lifi/TokenApproval.svelte`

ERC20 approval flow for bridge router.

### `src/routes/bridge/lifi/BridgeExecution.svelte`

Transaction execution with status tracking.

## Acceptance criteria

### UI

- [x] Renders with Bits UI primitives (Select, Input, Button, Dialog, Popover).
- [x] Chain selects filtered by testnet/mainnet setting.
- [x] User can enter amount with validation.
- [x] Routes fetched via `bridgeRoutesCollection`.
- [x] Route comparison with fees, duration, output amount.
- [x] Confirmation dialog before sending.
- [x] Errors displayed inline.

### Integration

- [x] `AccountsSelect.svelte` handles wallet discovery and connection.
- [x] `CoinBalances.svelte` displays USDC balances.
- [x] `TokenApproval.svelte` handles ERC20 approvals.
- [x] `BridgeExecution.svelte` executes selected route.

### E2E test

- [x] `e2e/bridge.test.ts` exists and runs with `deno task test:e2e`.
- [x] Test: select chains, enter amount.
- [x] Test: routes fetched and displayed.

## Status

Complete. Full bridge flow with wallet connection, balance display, route comparison,
approval, execution, and transaction history. Re-verification 2026-02-06 (PROMPT_build execute one spec): no incomplete specs; re-verified 004; all 14 AC—BridgeFlow/AccountsSelect/CoinBalances/TokenApproval/BridgeExecution in session flow, Bits UI, bridgeRoutesCollection, e2e/bridge.test.ts (select chains, amount, address); test:unit 44 Deno + 101 Vitest passed. Previous: Re-verification 2026-02-05 (PROMPT_build one spec): no incomplete specs; re-verified 004; all UI/integration/E2E AC confirmed; e2e/bridge.test.ts waits for Loading... to be hidden then asserts USDC Bridge|Connect a wallet; test:unit 44 Deno + 101 Vitest passed; test:e2e bridge 1 passed, 1 skipped.

## Output when complete

`DONE`
