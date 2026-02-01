# Spec 004: Bridge UI

Full bridge interface for USDC bridging via LI.FI, using Bits UI primitives.

**References:**

- https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

## Components

### `src/routes/bridge/+page.svelte`

Entry point that renders BridgeFlow.

### `src/routes/bridge/BridgeFlow.svelte`

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

### `src/routes/bridge/Wallets.svelte`

Wallet discovery and connection via EIP-6963.

### `src/routes/bridge/Balances.svelte`

USDC balance display per chain.

### `src/routes/bridge/TokenApproval.svelte`

ERC20 approval flow for bridge router.

### `src/routes/bridge/BridgeExecution.svelte`

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

- [x] `Wallets.svelte` handles wallet discovery and connection.
- [x] `Balances.svelte` displays USDC balances.
- [x] `TokenApproval.svelte` handles ERC20 approvals.
- [x] `BridgeExecution.svelte` executes selected route.

### E2E test

- [x] `e2e/bridge.test.ts` exists and runs with `pnpm test:e2e`.
- [x] Test: select chains, enter amount.
- [x] Test: routes fetched and displayed.

## Status

Complete. Full bridge flow with wallet connection, balance display, route comparison,
approval, execution, and transaction history.

## Output when complete

`DONE`
