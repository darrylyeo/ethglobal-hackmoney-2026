# Spec 036: Circle CCTP Bridge UI

Full bridge interface for USDC bridging via Circle CCTP, using Bits UI primitives.

**References:**

- https://developers.circle.com/cctp
- https://developers.circle.com/cctp/concepts/supported-chains-and-domains
- https://developers.circle.com/cctp/concepts/fees
- https://developers.circle.com/cctp/concepts/finality-and-block-confirmations
- https://developers.circle.com/cctp/concepts/fast-transfer-allowance
- https://developers.circle.com/cctp/concepts/forwarding-service
- https://developers.circle.com/cctp/howtos/get-transfer-fee
- https://developers.circle.com/cctp/howtos/get-fast-transfer-allowance
- https://developers.circle.com/cctp/howtos/resolve-stuck-attestation
- https://developers.circle.com/cctp/howtos/retry-failed-mint
- https://developers.circle.com/cctp/references/technical-guide
- https://developers.circle.com/cctp/migration-from-v1-to-v2

## Components

### `src/routes/cctp/+page.svelte`

Entry point that renders CctpBridgeFlow.

### `src/routes/cctp/CctpBridgeFlow.svelte`

Main CCTP bridge interface with:

1. **Testnet/mainnet toggle** – filters available networks
2. **Source chain select** – Bits UI Select, filtered by network type
3. **Destination chain select** – Bits UI Select, filtered by network type
4. **Amount input** – human-readable USDC amount with validation
5. **Recipient toggle** – send to self or custom address
6. **Transfer speed** – Standard vs Fast transfer selection
7. **Fee + estimate panel** – Fast Transfer fee (bps) and expected receive
8. **Allowance indicator** – Fast Transfer allowance remaining
9. **Transfer preview** – burn amount, destination amount, and recipient summary
10. **Confirmation dialog** – review before sending
11. **Error display** – inline error messages
12. **Transfer status** – burn tx, attestation polling, mint tx
13. **Forwarding option** – toggle Forwarding Service when supported

### `src/routes/cctp/CctpWallets.svelte`

Wallet discovery and connection via EIP-6963.

### `src/routes/cctp/CctpBalances.svelte`

USDC balance display per chain.

### `src/routes/cctp/CctpAttestation.svelte`

Attestation polling status and refresh control.

### `src/routes/cctp/CctpExecution.svelte`

Transaction execution for burn and mint with status tracking.

### `src/routes/cctp/CctpFees.svelte`

Fast Transfer fee lookup and max fee guidance.

### `src/routes/cctp/CctpAllowance.svelte`

Fast Transfer allowance display and availability warning.

## Acceptance criteria

### UI

- [ ] Renders with Bits UI primitives (Select, Input, Button, Dialog, Popover).
- [ ] Chain selects filtered by testnet/mainnet setting.
- [ ] User can enter amount with validation.
- [ ] User can select Standard or Fast transfer speed.
- [ ] Transfer preview shows burn and destination details.
- [ ] Fast Transfer fee fetched per route and shown in bps.
- [ ] Fast Transfer allowance displayed with last updated timestamp.
- [ ] Confirmation dialog before sending.
- [ ] Errors displayed inline.
- [ ] Status panel shows burn, attestation, and mint steps.
- [ ] Forwarding Service toggle shown only for supported destinations.
- [ ] Attestation polling treats 404 as pending, not failure.

### Integration

- [ ] `CctpWallets.svelte` handles wallet discovery and connection.
- [ ] `CctpBalances.svelte` displays USDC balances.
- [ ] `CctpAttestation.svelte` polls and refreshes attestation status.
- [ ] `CctpExecution.svelte` executes burn and mint steps.
- [ ] `CctpFees.svelte` fetches fees via `/v2/burn/USDC/fees`.
- [ ] `CctpAllowance.svelte` fetches allowance via `/v2/fastBurn/USDC/allowance`.

### E2E test

- [ ] `e2e/cctp-bridge.test.ts` exists and runs with `pnpm test:e2e`.
- [ ] Test: select chains, enter amount.
- [ ] Test: burn submitted, attestation polled, mint submitted (mocked).
- [ ] Test: Fast Transfer fee and allowance displayed.
- [ ] Test: 404 attestation response continues polling.
- [ ] Test: retry mint path allowed when previous mint fails (mocked).

## TODO

- [ ] Add wireframes for CCTP flow steps.
- [ ] Confirm supported chain list and domain IDs match Circle docs.
- [ ] Decide whether to expose Forwarding Service in UI or keep internal.

## Status

Not started.

## Output when complete

`DONE`
