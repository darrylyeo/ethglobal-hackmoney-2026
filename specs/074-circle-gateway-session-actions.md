# Spec 074: Circle Gateway and Arc USDC as supported session actions / intents

Add Circle Gateway as a bridge protocol option for session actions and intents.
Gateway provides a unified USDC balance across chains and instant transfers
(<500 ms). Arc Testnet is supported by Gateway (domain 26); Arc uses USDC as
native gas.

**References:**

- https://developers.circle.com/gateway
- https://developers.circle.com/gateway/references/supported-blockchains
- https://developers.circle.com/gateway/concepts/technical-guide
- https://developers.circle.com/gateway/references/fees
- https://developers.circle.com/api-reference/gateway/all/create-transfer-attestation
- https://developers.circle.com/api-reference/gateway/all/get-token-balances
- https://developers.circle.com/api-reference/gateway/all/estimate-transfer
- https://developers.circle.com/gateway/references/contract-addresses

## Scope

- Bridge session: add Gateway as a third protocol choice (`protocolIntent`:
  `'cctp' | 'lifi' | 'gateway'`).
- Session params: extend bridge params to support Gateway; normalize at
  collection boundary.
- Protocol router: show Gateway when the selected chain pair is
  Gateway-supported; Gateway-specific settings only when needed (e.g. deposit
  vs instant transfer based on unified balance).
- Intent resolution: bridge intents (spec 038) may resolve to a Gateway route
  when both chains are Gateway-supported; route list and preview include
  Gateway.
- Constants and API: Gateway domain IDs, API base URLs, wallet/minter contract
  addresses; fetch balances, estimate transfer, create attestation.
- Execution: when user selects Gateway, run deposit (if establishing balance)
  or burn-intent → attestation API → mint on destination.

## Non-goals

- Solana Gateway flows (EVM-only for this spec).
- Trustless withdrawal UI (7-day delay path).
- Delegate management UI (add/remove delegate for SCAs).
- Bridge Kit integration for Gateway (use Gateway HTTP API + contracts
  directly).

## Definitions

### Gateway

Circle product: users deposit USDC into non-custodial Gateway Wallet contracts
on any supported source chain; after finality, a unified balance is available
and they can transfer instantly to any supported destination via attestation
API + Gateway Minter. No new action type—Gateway is a **bridge protocol** like
CCTP and LI.FI.

### Gateway-supported pair

Source and destination chain IDs both appear in the Gateway supported list for
the current network (testnet/mainnet). Arc Testnet = domain 26 (testnet only;
no Arc mainnet in Gateway yet).

## Data model

### BridgeSessionParams extension

- `protocolIntent`: `'cctp' | 'lifi' | 'gateway' | null`
- No extra Gateway-only params required for minimal flow: same fromChainId,
  toChainId, amount, recipient as existing bridge. Optional later: e.g.
  `gatewayDepositOnly` if we want to separate “deposit to unified balance” from
  “instant transfer” in one session.

### Gateway constants (new)

- `src/constants/gateway.ts`:
  - `gatewayDomainEntries / gatewayDomainByChainId`: map ChainId → Gateway domain (same domain
    IDs as CCTP where overlapping; include Arc Testnet 26).
  - `GATEWAY_API_BASE_TESTNET`, `GATEWAY_API_BASE_MAINNET`.
  - Gateway Wallet and Gateway Minter contract addresses per chain (from
    Circle contract-addresses doc).
  - `isGatewaySupportedChain(chainId, isTestnet): boolean`.
  - Helper to derive supported chain set for current network.

## API usage

- **Balances:** `POST /v1/balances` — unified USDC balance per address (and
  per chain/token). Use to show “unified balance” and to decide whether user
  can do instant transfer or must deposit first.
- **Estimate:** `POST /v1/transfer` estimate endpoint (or documented
  estimate API) — fees and expiration block for a transfer.
- **Transfer attestation:** `POST /v1/transfer` with signed burn intent(s) →
  `transferId`, `attestation`, `signature`, `fees`, `expirationBlock`. Then
  call Gateway Minter on destination with attestation + signature.

Flow: build BurnIntent (EIP-712 on EVM) → sign with depositor EOA (or
delegate) → POST /v1/transfer → receive attestation → call minter.mint (or
equivalent) on destination.

## UI

- **UnifiedProtocolRouter:** Add third option `Gateway` with label “Gateway”
  and detail “Unified balance, instant transfer”, enabled when
  `gatewayPairSupported`. `protocolIntent` type and bindings accept
  `'gateway'`.
- **BridgeAction:** When `protocolIntent === 'gateway'`, render Gateway flow:
  - If unified balance (from API) is sufficient for amount: show instant
    transfer path (burn intent → attestation → mint).
  - Else: show deposit path first (deposit to Gateway Wallet on source), then
    after confirmations instant transfer (or prompt user to retry after
    balance is ready).
- **Bridge execution:** Reuse existing session execution orchestration; when
  protocol is Gateway, call new Gateway execution helper (deposit and/or
  attestation + mint) instead of CCTP/LI.FI.
- **Intent routes (spec 038):** When resolving routes for a bridge intent,
  include a Gateway route when both chains are Gateway-supported. Route
  preview uses the same BridgeAction with `protocolIntent: 'gateway'`.

## Acceptance criteria

- [x] `src/constants/gateway.ts` exists with Gateway domain map (including Arc
  Testnet 26), API base URLs, and wallet/minter addresses for supported EVM
  chains; `isGatewaySupportedChain(chainId, isTestnet)` implemented.
- [x] BridgeSessionParams and normalizer support `protocolIntent: 'cctp' |
  'lifi' | 'gateway' | null`; session params normalize `'gateway'` at
  collection boundary.
- [x] UnifiedProtocolRouter shows Gateway as a protocol option when the
  selected from/to chain pair is Gateway-supported; protocolIntent can be set
  to `'gateway'`.
- [x] BridgeAction when protocol is Gateway: shows deposit or instant
  transfer based on unified balance (from Gateway balances API); user can
  complete deposit and/or instant transfer within the same session flow.
- [x] Gateway API client: fetch balances (POST /v1/balances), estimate
  transfer, create transfer attestation (POST /v1/transfer with signed burn
  intent); attestation + signature used to call Gateway Minter on destination.
- [x] Execution path for Gateway: deposit (if needed) via Gateway Wallet
  contract; then build/sign burn intent, get attestation, submit mint on
  destination; status and errors surfaced in existing execution/status UI.
- [x] Intent resolution: bridge intent with both chains Gateway-supported
  includes a Gateway route; selecting it opens session with
  `protocolIntent: 'gateway'` and same from/to/amount/recipient.
- [x] E2E (optional for first iteration): session with Gateway selected,
  chain pair Gateway-supported, amount entered; balance/estimate or deposit
  step exercised (can be mocked for attestation/mint).

## TODOs

- [x] Implement gateway constants and chain support check.
- [x] Implement Gateway API client (balances, estimate, create transfer
  attestation).
- [x] Extend BridgeSessionParams and normalizer for `gateway`.
- [x] Extend UnifiedProtocolRouter and BridgeAction for Gateway flow and
  execution.
- [x] Add Gateway route to intent resolution when pair is Gateway-supported.
- [x] E2E for Gateway bridge flow (mock or testnet) — optional first iteration.

## Status

Complete. Constants, API client, params, UnifiedProtocolRouter, BridgeAction
Gateway flow (balance + deposit/instant message), intent route, and execution
path (deposit via Gateway Wallet when needed, wait for balance, build/sign burn
intent EIP-712, create transfer attestation, gatewayMint on destination; status
and errors in GatewayBridgeFlow + GatewayExecution). E2E: e2e/gateway-bridge.test.ts
with addGatewayMocks; selectProtocolOption extended for Gateway.

## Output when complete

`DONE`
