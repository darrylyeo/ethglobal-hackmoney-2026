# Spec 122: NEAR Intents for swap and bridge

Add NEAR Intents to **both** action flows. **Swap action** = same chain → same chain (token A for token B). **Bridge action** = cross-chain, same coin (coin instance on chain A → same coin on chain B). NEAR Intents provide one-step fulfillment via LI.FI's order server (OIF-compatible quote) and a solver network; settlement is verified on NEAR.

**Status:** Incomplete

## Summary

- **Action model:** Swap = same chain to same chain. Bridge = cross-chain, same coin (e.g. USDC on chain A → USDC on chain B). This spec adds NEAR Intents to **both** flows.
- **Swap protocol options:** Extend with `NearIntents`. User can select NEAR Intents in the swap protocol fieldset. Quote from order server: one input (tokenIn on chainId), one output (tokenOut on same chainId). Not via spanDEX.
- **Bridge protocol options:** Extend with `NearIntents`. User can select NEAR Intents in the bridge protocol fieldset. Quote from order server: one input (coin on fromChain), one output (same coin on toChain). Not via getRoutes/getQuote or Gateway/CCTP.
- **Asset format:** Order server uses **interoperable addresses** (EIP-7930). Use existing `toInteropHex(chainId, address)` from interop.ts for all user, receiver, and asset fields.
- **Flows:** When swap protocol is NearIntents → `getIntentsQuote(chainId, tokenIn, tokenOut, amount, userAddress)`. When bridge protocol is NearIntents → `getIntentsBridgeQuote(fromChainId, toChainId, amount, fromAddress, toAddress, same coin)`. Both call order server quote endpoint; show quote panel; on confirm, order-submit.

## References

- https://docs.li.fi/lifi-intents/for-developers/quote
- https://order.li.fi/docs (Swagger: quote/request, order submission)
- https://eips.ethereum.org/EIPS/eip-7930 (Interoperable Addresses)
- OIF types: https://github.com/openintentsframework/oif-specs/blob/main/schemas/typescript/types.ts (`GetQuoteRequest`, `Input`, `Output`, `Address`, `Amount`)
- Spec 054 ([specs/054-interop-addresses.md](specs/054-interop-addresses.md)) and [src/constants/interop.ts](src/constants/interop.ts) for `toInteropHex` / `fromInteropBinary`
- NEAR integration research plan (`.cursor/plans/near_blockchain_integration_research_*.plan.md`)

## Scope

### Constants and types

- **Protocol:** Add `Protocol.NearIntents` in [src/constants/protocols.ts](src/constants/protocols.ts) with label, icon, detail. Add to `protocols` array.
- **Swap protocol intent:** Add `SwapProtocolId.NearIntents = 'near-intents'` in [src/constants/swap-protocol-intents.ts](src/constants/swap-protocol-intents.ts). Add mapping to `Protocol.NearIntents`. Do **not** add to spanDEX provider mappings.
- **Bridge protocol intent:** Add `BridgeProtocolId.NearIntents = 'near-intents'` in [src/constants/bridge-protocol-intents.ts](src/constants/bridge-protocol-intents.ts). Add mapping to `Protocol.NearIntents`. Update `bridgeProtocolIds`, `bridgeIdToProtocol`, `protocolToBridgeId`.
- **Action params:** Swap params accept `swapProtocolIntent: 'near-intents'`. Bridge params accept `protocolIntent: 'near-intents'` (in [src/constants/actions.ts](src/constants/actions.ts) and any validation).

### API layer

- **Order server quotes** (e.g. in `src/api/lifi-intents.ts` or extend `src/api/lifi.ts`):
  - **Swap (same-chain):** `getIntentsQuote(params)`: params = chainId, tokenIn, tokenOut, amount (smallest unit), userAddress. OIF request: **user** = `toInteropHex(chainId, userAddress)`; **inputs** = one entry (user, asset = `toInteropHex(chainId, tokenIn)`, amount); **outputs** = one entry (receiver = same user, asset = `toInteropHex(chainId, tokenOut)`). Call order server quote endpoint; return normalized quote.
  - **Bridge (cross-chain, same coin):** `getIntentsBridgeQuote(params)`: params = fromChainId, toChainId, amount, fromAddress, toAddress, same coin (e.g. USDC). OIF request: **user** = `toInteropHex(fromChainId, fromAddress)`; **inputs** = one entry (user, asset = coin on fromChain via `toInteropHex(fromChainId, getUsdcAddress(fromChainId))`, amount); **outputs** = one entry (receiver = `toInteropHex(toChainId, toAddress)`, asset = same coin on toChain). Call order server quote endpoint; return normalized quote.
  - Use existing `toInteropHex` / `fromInteropBinary` from [src/constants/interop.ts](src/constants/interop.ts) (spec 054).
- **Order submission:** Placeholder or minimal for both flows after user accepts (exact endpoint per LI.FI order server docs). Fulfillment can be phased.

### UI

- **Swap:** `SwapProtocolFieldset` includes NEAR Intents. When `swapProtocolIntent === SwapProtocolId.NearIntents`, use Intents quote path (no spanDEX). Show Intents quote panel; on confirm, order-submit.
- **Bridge:** Bridge protocol fieldset includes NEAR Intents (same pattern as CCTP, LI.FI, Gateway). When `protocolIntent === BridgeProtocolId.NearIntents`, use Intents quote path. Show Intents quote panel (preview inputs/outputs, validUntil); on confirm, order-submit. NEAR wallet UX minimal in first slice.

### Session and resolution

- **Protocol actions:** Both `ActionType.Swap` with `Protocol.NearIntents` and `ActionType.Bridge` with `Protocol.NearIntents` are valid.
- **Quote fetch:** Swap session branches on `swapProtocolIntent`: if NearIntents → `getIntentsQuote(...)`. Bridge session branches on `protocolIntent`: if NearIntents → `getIntentsBridgeQuote(...)`.

## Non-goals (for this spec)

- Adding NEAR Intents to spanDEX aggregation (Auto). Auto continues to aggregate existing swap providers only.
- Full NEAR wallet integration (minimal acceptable).
- Native NEAR chain/block/explorer UI.

## Data model

### Swap params (extended)

- `swapProtocolIntent`: `'auto' | 'uniswap' | 'lifi' | 'odos' | 'kyberswap' | 'relay' | 'near-intents'` (or existing enum + `'near-intents'`).

### Bridge params (extended)

- `protocolIntent`: `'cctp' | 'lifi' | 'gateway' | 'near-intents'`
- Bridge already has fromChainId, toChainId, amount, recipient; same coin is implied (e.g. USDC). For NearIntents, coin is the same on both chains (from coin-instances or getUsdcAddress per chain).

### Intents quote (same as before)

- Request: user (Address), intent (intentType "oif-swap", inputs, outputs, swapType exact-input, minValidUntil?). Input/Output: user/receiver, asset (interop hex), amount (string wei).
- Response: quotes array with validUntil, quoteId, preview (inputs, outputs), metadata.

## Acceptance criteria

- [ ] `Protocol.NearIntents` exists in protocols.ts and is in `protocols` array with label and icon.
- [ ] `SwapProtocolId.NearIntents` exists in swap-protocol-intents.ts with mapping to `Protocol.NearIntents`; do not add to spanDEX provider mappings.
- [ ] `BridgeProtocolId.NearIntents` exists in bridge-protocol-intents.ts with mapping to `Protocol.NearIntents`; bridgeProtocolIds and lookup maps updated.
- [ ] Swap action params allow `swapProtocolIntent: 'near-intents'`. Bridge action params allow `protocolIntent: 'near-intents'`.
- [ ] Order server quote for swap: `getIntentsQuote` builds an OIF request with one input and one output (same chainId); uses `toInteropHex`; calls order server quote endpoint; returns normalized quote.
- [ ] Order server quote for bridge: `getIntentsBridgeQuote` builds an OIF request with one input (fromChain + coin address, amount) and one output (toChain + same coin address, receiver); uses `toInteropHex`; calls order server quote endpoint; returns normalized quote.
- [ ] Coin instance resolution (bridge): fromChainId + toChainId + coin (e.g. USDC) yield token addresses for both chains; used for asset fields in OIF request.
- [ ] Swap protocol fieldset includes NEAR Intents; when selected, swap flow uses Intents quote path. Bridge protocol fieldset includes NEAR Intents; when selected, bridge flow uses Intents quote path.
- [ ] When swap or bridge protocol is NearIntents, a quote panel shows order-server quote (preview, validity); on confirm, order-submit is invoked (placeholder OK for first slice).
- [ ] Protocol actions: Swap and Bridge with Protocol.NearIntents are valid and trigger Intents quote fetch when selected.
- [ ] Unit test(s): mock order server; assert swap request shape (one input, one output, same chainId, interoperable addresses) and bridge request shape (one input, one output, two chainIds, same coin, interoperable addresses).

## Research (continued)

### Same chain vs cross-chain

- **Swap:** Same chain to same chain only. NEAR Intents is a swap protocol option (user can select).
- **Bridge:** Cross-chain, same coin (one coin instance → another). NEAR Intents is a bridge protocol option.

### Existing interop (spec 054)

- Use `toInteropHex(chainId, address)` for every OIF user, receiver, and asset field. Use `fromInteropBinary(hex)` when displaying quote preview.

### OIF GetQuoteRequest

- user, intent.intentType "oif-swap", intent.inputs (one entry for bridge: user, asset = fromChain coin address, amount), intent.outputs (one entry: receiver, asset = toChain coin address), intent.swapType "exact-input", intent.minValidUntil?, supportedTypes. Amounts as decimal strings in smallest unit.

### Bridge session → Intents request mapping

- **user** = `toInteropHex(fromChainId, fromAddress)`.
- **inputs** = [{ user, asset: `toInteropHex(fromChainId, getUsdcAddress(fromChainId))`, amount: amountWeiString }].
- **outputs** = [{ receiver: `toInteropHex(toChainId, toAddress)`, asset: `toInteropHex(toChainId, getUsdcAddress(toChainId))` }].

### Order server

- Base **https://order.li.fi**; quote path from Swagger. Same as previous research.

## Output when complete

`DONE`
