# Spec 037: Generic Bridge UI

Unified USDC bridge interface that routes between LI.FI and Circle CCTP based
on user selections and chain support.

**References:**

- https://developers.circle.com/cctp
- https://developers.circle.com/cctp/concepts/supported-chains-and-domains
- https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

## Routes

### `/bridge`

Unified UI for chain selection and protocol routing.

### `/bridge/lifi`

LI.FI bridge UI (existing `specs/004-bridge-ui.md`), now under `/bridge/lifi`.

### `/bridge/cctp`

Circle CCTP bridge UI (existing `specs/036-circle-cctp-bridge-ui.md`), now under
`/bridge/cctp`.

## Components

### `src/routes/bridge/+page.svelte`

Entry point that renders UnifiedBridgeFlow.

### `src/routes/bridge/UnifiedBridgeFlow.svelte`

Unified bridge interface with:

1. **Testnet/mainnet toggle** – filters available networks
2. **Source chain select** – union of LI.FI + CCTP supported chains
3. **Destination chain select** – union of LI.FI + CCTP supported chains
4. **Amount input** – human-readable USDC amount with validation
5. **Recipient toggle** – send to self or custom address
6. **Protocol badge** – shows chosen protocol (LI.FI or CCTP) and reason
7. **Protocol-specific options** – only shown when active:
	- CCTP: transfer speed, fees, allowance, forwarding toggle
	- LI.FI: route comparison + fee breakdown
8. **Confirmation dialog** – review before sending
9. **Error display** – inline error messages

### `src/routes/bridge/UnifiedProtocolRouter.svelte`

Derives the active protocol and renders the appropriate flow:

- `src/routes/bridge/lifi/BridgeFlow.svelte`
- `src/routes/bridge/cctp/CctpBridgeFlow.svelte`

## Selection rules

1. **Only one protocol supports the pair** – choose it automatically.
2. **Both protocols support the pair** – choose based on user intent:
	- CCTP if user selects transfer speed or forwarding options
	- LI.FI if user opens route comparison or selects a specific LI.FI route
	- Default to CCTP for USDC if no explicit protocol intent is expressed
3. **Unsupported pair** – show error and disable submit.

When the active protocol changes, the UI preserves shared fields (chains,
amount, recipient) and resets protocol-specific state.

## Acceptance criteria

### Routing

- [ ] `/bridge/lifi` renders the existing LI.FI bridge UI.
- [ ] `/bridge/cctp` renders the existing CCTP bridge UI.
- [ ] `/bridge` renders the unified bridge UI.

### UI

- [ ] Chain selects show the union of LI.FI + CCTP supported chains.
- [ ] Protocol badge always explains the selection reason.
- [ ] Protocol-specific controls appear only when active.
- [ ] Shared fields persist when protocol switches.

### Integration

- [ ] Unified flow can execute LI.FI or CCTP based on selection rules.
- [ ] Protocol switch clears incompatible derived data (routes, fees, status).
- [ ] Unsupported pairs show a clear inline error.

### E2E test

- [ ] `e2e/unified-bridge.test.ts` exists and runs with `pnpm test:e2e`.
- [ ] Test: chain pair that only CCTP supports selects CCTP.
- [ ] Test: chain pair that only LI.FI supports selects LI.FI.
- [ ] Test: shared pair defaults to CCTP, then switches to LI.FI when route
  comparison is opened.

## Status

Not started.

## Output when complete

`DONE`
