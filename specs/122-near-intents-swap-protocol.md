# Spec 122: NEAR Intents as a swap protocol

Add NEAR Intents as a first-class swap protocol option. NEAR Intents provide one-step cross-chain swaps via LI.FI's order server (OIF-compatible quote) and a solver network; settlement is verified on NEAR. This is a separate quote/execution path from spanDEX and from classic LI.FI getRoutes/getQuote.

**Status:** Incomplete

## Summary

- **Swap protocol options:** Extend with `NearIntents`. User can select NEAR Intents in the swap protocol fieldset; quote is fetched from the LI.FI order server (OIF `quote` endpoint), not from spanDEX or LI.FI SDK getQuote.
- **Asset format:** Order server uses **interoperable addresses** (EIP-7930 / CAIP-350): chain + address encoded in one bytes value. Supports EVM and non-EVM chains (e.g. NEAR, Solana) as source/destination.
- **Flow:** When swap protocol is NearIntents: (1) map current swap params (chainId, token addresses, amount) to OIF quote request (user, intent with inputs/outputs as interoperable addresses); (2) call order server quote endpoint; (3) display quote(s); (4) on confirm, submit order and handle fulfillment (solver executes; may require intent signature and/or NEAR wallet for NEAR-side settlement).

## References

- https://docs.li.fi/lifi-intents/for-developers/quote
- https://order.li.fi/docs (Swagger: quote/request, order submission)
- https://eips.ethereum.org/EIPS/eip-7930 (Interoperable Addresses)
- https://chainagnostic.org/CAIPs/caip-350 (Binary serialization)
- OIF types: https://github.com/openintentsframework/oif-specs/blob/main/schemas/typescript/types.ts (`GetQuoteRequest`, `Input`, `Output`, `Address`, `Amount`)
- Spec 054 ([specs/054-interop-addresses.md](specs/054-interop-addresses.md)) and [src/constants/interop.ts](src/constants/interop.ts) for `toInteropHex` / `fromInteropBinary`
- NEAR integration research plan (`.cursor/plans/near_blockchain_integration_research_*.plan.md`)

## Scope

### Constants and types

- **Protocol:** Add `Protocol.NearIntents` in `src/constants/protocols.ts` with label, icon, detail. Add protocol definition to `protocols` array.
- **Swap protocol intent:** Add `SwapProtocolId.NearIntents = 'near-intents'` in `src/constants/swap-protocol-intents.ts`. Add mapping entry (id: NearIntents, protocol: Protocol.NearIntents). Do **not** add to spanDEX provider mappings (NEAR Intents use order server, not spanDEX).
- **Action params:** Extend swap action params schema (e.g. in `src/constants/actions.ts`) so `swapProtocolIntent` accepts the new id (type/valueOf updated).

### API layer

- **Order server quote:** New module (e.g. `src/api/lifi-intents.ts`) or extend `src/api/lifi.ts` with:
  - `getIntentsQuote(params)`: build OIF-style quote request (user address, intent with `intentType: "oif-swap"`, inputs/outputs). Encode all address fields (user, receiver, asset) using **existing** `toInteropHex(chainId, address)` from [src/constants/interop.ts](src/constants/interop.ts) (spec 054). Call LI.FI order server quote endpoint. Return normalized quote response (validUntil, quoteId, preview inputs/outputs).
  - Decode quote preview for display using `fromInteropBinary(hex)` from interop.ts where needed. No new encoding layer for EVM; add NEAR chain type only if/when supporting NEAR as source/destination.
- **Order submission:** Placeholder or minimal implementation for submitting an order after user accepts a quote (exact endpoint and payload per LI.FI order server docs). Execution/fulfillment (solver relay, NEAR verifier) can be phased.

### UI

- **SwapProtocolFieldset:** Show NEAR Intents as a selectable protocol card (same pattern as LiFi, Odos, etc.). When `swapProtocolIntent === SwapProtocolId.NearIntents`, do not use spanDEX; use Intents quote path.
- **Quote panel:** When protocol is NearIntents, show an Intents quote panel (new component or variant) that displays order-server quote result (e.g. preview inputs/outputs, validUntil, solver metadata). No SpandexQuotesPanel for this path.
- **Execution:** When user confirms, call order-submit flow (sign intent if required; show status). If destination is NEAR or requires NEAR wallet, show appropriate connect/sign UX (can be minimal in first slice).

### Session and resolution

- **Protocol actions:** In `protocolActions` (or equivalent), add support for `ActionType.Swap` with `Protocol.NearIntents` so that swap intents can resolve to NEAR Intents when user has selected that protocol.
- **Quote fetch:** Swap session flow branches on `swapProtocolIntent`: if NearIntents, fetch via `getIntentsQuote(...)` and store in a dedicated collection or slice; otherwise existing spanDEX/Uniswap path.

## Non-goals (for this spec)

- Adding NEAR Intents to spanDEX aggregation (Auto). Auto continues to aggregate LiFi, Odos, KyberSwap, Relay only.
- Full NEAR wallet integration (can be minimal: e.g. link to NEAR wallet or read-only display of NEAR-side outcome).
- Native NEAR chain/block/explorer UI (spec 122 is swap-protocol only).

## Data model

### Swap params (unchanged shape, extended enum)

- `swapProtocolIntent`: `'auto' | 'uniswap' | 'lifi' | 'odos' | 'kyberswap' | 'relay' | 'near-intents'`

### Intents quote (new types)

- Request: user (address), intent (intentType, inputs, outputs, swapType, minValidUntil?). Input/Output: user/receiver, asset (interoperable address bytes), amount.
- Response: quotes array with validUntil, quoteId, preview (inputs, outputs), metadata (exclusiveFor?).

## Acceptance criteria

- [ ] `Protocol.NearIntents` exists in `src/constants/protocols.ts` and is included in `protocols` array with label and icon.
- [ ] `SwapProtocolId.NearIntents` exists in `src/constants/swap-protocol-intents.ts` with mapping to `Protocol.NearIntents`; not in `spandexProviderMappings`.
- [ ] Swap action params allow `swapProtocolIntent: 'near-intents'` (arktype schema or equivalent updated).
- [ ] Order server quote: a function (e.g. `getIntentsQuote`) builds an OIF-style request with interoperable addresses, calls the LI.FI order server quote endpoint, and returns a normalized quote result. EVM (chainId + 0x address) is encoded to interoperable address format for the request.
- [ ] Interoperable address encoding: use existing `toInteropHex(chainId, address)` from interop.ts for all OIF request address fields (user, receiver, asset). Decoding of quote preview via `fromInteropBinary` optional for first slice.
- [ ] `SwapProtocolFieldset` includes NEAR Intents as a selectable protocol; when selected, swap flow uses Intents quote path (no spanDEX).
- [ ] When swap protocol is NearIntents, a quote panel shows the order-server quote (preview inputs/outputs and validity); no SpandexQuotesPanel for this protocol.
- [ ] Protocol actions / session resolution: Swap with Protocol.NearIntents is valid and triggers Intents quote fetch when protocol is selected.
- [ ] Unit test: mock order server quote response; assert request shape (interoperable addresses for EVM) and normalized quote parsing.

## Research (continued)

### Existing interop in this project (spec 054)

- **Spec 054** ([specs/054-interop-addresses.md](specs/054-interop-addresses.md)) is complete. The app uses `@wonderland/interop-addresses` and [src/constants/interop.ts](src/constants/interop.ts).
- **Reuse for Intents:** `toInteropHex(chainId, address)` returns EIP-7930 hex (`0x${string}`). OIF types use `Address = string` (hex). Use `toInteropHex` for every `user`, `receiver`, and `asset` field in the quote request so no new encoding layer is required for EVM.
- **Decode:** `fromInteropBinary(hex)` returns `InteroperableAddressText`; use when displaying quote preview (chain + address from response).

### OIF GetQuoteRequest (OIF spec types)

- **user:** `Address` (interoperable address hex string).
- **intent.intentType:** `"oif-swap"`.
- **intent.inputs:** `Input[]` — each has `user`, `asset`, `amount` (string, wei). For exact-input swap, `amount` is required.
- **intent.outputs:** `Output[]` — each has `receiver`, `asset`, `amount?` (optional for exact-input).
- **intent.swapType:** `"exact-input" | "exact-output"` (default `"exact-input"`).
- **intent.minValidUntil?:** Unix timestamp in seconds; only quotes valid at least until this time.
- **intent.preference?**, **originSubmission?**, **lock?**, **failureHandling?**, **partialFill?**, **metadata?** are optional; can be omitted for a minimal first implementation.
- **supportedTypes:** Required by OIF; array of order type strings the client supports (e.g. `["oif-escrow-v0"]` or as per LI.FI order server docs).

### Amounts

- All amounts are **decimal strings** in smallest unit (wei for ETH, 6 decimals for USDC). No floats; e.g. `"4000000000"` for 4000 USDC.

### Order server endpoint

- LI.FI order server base: **https://order.li.fi** (Swagger at https://order.li.fi/docs). The quote endpoint is OIF-compatible; exact path (e.g. `POST /quote/request` or under `/bridge-api`) should be taken from the order server Swagger/OpenAPI. Main LI.FI API (`https://li.quest/v1/quote`) is for classic routes, not for Intents order-server quotes.

### Swap session → Intents request mapping

- Current swap params: `chainId`, `tokenIn`, `tokenOut`, `amount`, `slippage`, user address. Map to: **user** = `toInteropHex(chainId, userAddress)` (or signer address); **inputs** = one entry with `user`, `asset` = `toInteropHex(chainId, tokenIn)`, `amount` = amount in wei string; **outputs** = one entry with `receiver` = same user, `asset` = `toInteropHex(chainId, tokenOut)` (or toChainId if cross-chain), `amount` omitted for exact-input.

## Output when complete

`DONE`
