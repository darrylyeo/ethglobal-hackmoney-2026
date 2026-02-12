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

### `src/routes/bridge/cctp/+page.svelte`

Entry point that renders CctpBridgeFlow.

### `src/routes/bridge/cctp/CctpBridgeFlow.svelte`

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

### `src/routes/bridge/cctp/CctpWallets.svelte`

Wallet discovery and connection via EIP-6963.

### `src/routes/bridge/cctp/CctpBalances.svelte`

USDC balance display per chain.

### `src/routes/bridge/cctp/CctpAttestation.svelte`

Attestation polling status and refresh control.

### `src/routes/bridge/cctp/CctpExecution.svelte`

Transaction execution for burn and mint with status tracking.

### `src/routes/bridge/cctp/CctpFees.svelte`

Fast Transfer fee lookup and max fee guidance.

### `src/routes/bridge/cctp/CctpAllowance.svelte`

Fast Transfer allowance display and availability warning.

## Acceptance criteria

### UI

- [x] Renders with Bits UI primitives (Select, Input, Button, Dialog, Popover).
- [x] Chain selects filtered by testnet/mainnet setting.
- [x] User can enter amount with validation.
- [x] User can select Standard or Fast transfer speed.
- [x] Transfer preview shows burn and destination details.
- [x] Fast Transfer fee fetched per route and shown in bps.
- [x] Fast Transfer allowance displayed with last updated timestamp.
- [x] Confirmation dialog before sending.
- [x] Errors displayed inline.
- [x] Status panel shows burn, attestation, and mint steps.
- [x] Forwarding Service toggle shown only for supported destinations.
- [x] Attestation polling treats 404 as pending, not failure.

### Integration

- [x] `CctpWallets.svelte` uses `AccountsSelect.svelte` for wallet discovery and connection.
- [x] `CctpBalances.svelte` displays USDC balances.
- [x] `CctpAttestation.svelte` polls and refreshes attestation status.
- [x] `CctpExecution.svelte` executes burn and mint steps.
- [x] `CctpFees.svelte` fetches fees via `/v2/burn/USDC/fees`.
- [x] `CctpAllowance.svelte` fetches allowance via `/v2/fastBurn/USDC/allowance`.

### E2E test

- [x] `e2e/cctp-bridge.test.ts` exists and runs with `deno task test:e2e`.
- [x] Test: select chains, enter amount.
- [x] Test: burn submitted, attestation polled, mint submitted (mocked).
- [x] Test: Fast Transfer fee and allowance displayed.
- [x] Test: 404 attestation response continues polling.
- [x] Test: retry mint path allowed when previous mint fails (mocked).

## Wireframes / flow

CCTP flow steps (user perspective):

1. **Setup** – Select source/destination chains, amount, Standard vs Fast, optional custom recipient. Transfer preview shows burn amount, destination amount, fees.
2. **Confirm** – Confirmation dialog summarizes transfer; user confirms.
3. **Burn** – User signs burn tx on source chain; status shows "Burn submitted" and explorer link.
4. **Attestation** – UI polls CCTP attestation API; status shows "Waiting for attestation…" (or "Attested").
5. **Mint** – Once attested, user signs mint tx on destination (or Forwarding Service is used when enabled); status shows "Mint submitted" and explorer link.
6. **Complete** – Success message; balances refresh.

## Supported chains and domains

`src/constants/cctp.ts` defines `cctpDomainEntries`, `cctpDomainByChainId`, and related sets; domain/contract helpers in `lib/cctp.ts`. Domain IDs and supported EVM chains align with [Circle CCTP supported blockchains and domain identifiers](https://developers.circle.com/cctp/concepts/supported-chains-and-domains). Solana, BNB Smart Chain, and Starknet are out of scope for this app (EVM-only bridge UI).

## Forwarding Service

Decision: **expose in UI when supported.** The Forwarding Service toggle is shown only when the selected destination chain is in `CCTP_FORWARDING_CHAIN_IDS` (see `CctpBridgeFlow.svelte`). When enabled, mint is executed via Circle’s Forwarding Service instead of the user signing a mint tx.

## TODO

- [x] Add wireframes for CCTP flow steps.
- [x] Confirm supported chain list and domain IDs match Circle docs.
- [x] Decide whether to expose Forwarding Service in UI or keep internal.

## Status

Complete. CCTP bridge UI with CctpWallets (AccountsSelect), CctpBalances, CctpFees, CctpAllowance, CctpAttestation, CctpExecution; confirmation dialog; transfer preview; E2E tests (confirmation dialog test skipped until mock sets selectedActor). Wireframes/flow documented; supported chains and domain IDs confirmed against Circle docs; Forwarding Service exposed in UI when destination is in CCTP_FORWARDING_CHAIN_IDS.

## Output when complete

`DONE`
