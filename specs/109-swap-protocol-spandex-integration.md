# Spec 109: Swap protocol and spanDEX integration

**Status:** Complete

## Summary

spanDEX is a meta-aggregator, not a protocol. Swap protocol options are first-class (UniswapV4, LiFi, Odos, KyberSwap, Relay). "Auto" uses spanDEX to aggregate LiFi/Odos/KyberSwap/Relay with a selectable strategy (best value, fastest, lowest gas). All aggregator/strategy options and defaults come from `src/constants/protocols.ts` (Spec 123).

## Model

- **Swap protocol options:** Auto, UniswapV4, LiFi, Odos, KyberSwap, Relay (see swap-protocol-intents.ts).
- **Auto:** User picks **aggregator** (Spandex / None) and, when Spandex, **strategy** (best value, fastest, lowest gas). spanDEX aggregates across LiFi, Odos, KyberSwap, Relay.
- **LiFi/Odos/KyberSwap/Relay:** Single-provider quote via spanDEX `getQuoteForProvider` when aggregator is Spandex.
- **UniswapV4:** Direct integration (constant product AMM), not via spanDEX.

## Params

Swap action params (defaults from protocols.ts):

- `swapProtocolIntent`: `SwapProtocolId` (default `Auto`)
- `swapAggregator`: `ProtocolAggregatorId` — default Spandex (in actions.ts schema; fallbacks in Action.svelte / SwapProtocolFieldset). Quote section is shown when the aggregator has strategies (`protocolAggregatorsById[swapAggregator].strategies.length > 0`) and intent is Auto or a spanDEX-backed protocol.
- `swapStrategy`: `ProtocolStrategy` — default BestPrice (in actions.ts schema; fallbacks and API/collection default args where used). Used when aggregator supports strategies for sorting/choosing quotes.

## UI

- **SwapProtocolFieldset**: Auto row shows Aggregator dropdown (`protocolAggregatorIds` / `protocolAggregatorsById`) and Strategy dropdown when `protocolAggregatorsById[swapAggregator].strategies.length > 0`; protocol cards for UniswapV4, LiFi, etc. No hardcoded Spandex/None or strategy list.
- **SwapQuotes**: Shown when `swapShowsQuoteSection` — i.e. aggregator has strategies (`protocolAggregatorsById[swapAggregator].strategies.length > 0`) and (Auto or a spanDEX-backed protocol).

## Constants (Spec 123)

Aggregator ids, labels, and strategies per aggregator (on `ProtocolAggregator.strategies`) are in `src/constants/protocols.ts`. Swap param defaults (Spandex, BestPrice) are defined where used (actions.ts, components, api/spandex, SwapQuotes). Quote section visibility is derived from `protocolAggregatorsById[swapAggregator].strategies.length > 0`.

## References

- Spec 123 (protocol/aggregator constants), Spec 065 (external API cache)
- `swap-protocol-intents.ts`, `protocol-aggregator-providers.ts`, `protocol-aggregator-quote-strategies.ts`
- `routes/session/SwapProtocolFieldset.svelte`, `SwapQuotes.svelte`, `Action.svelte`, `ProtocolAggregatorQuoteItems.ts`
