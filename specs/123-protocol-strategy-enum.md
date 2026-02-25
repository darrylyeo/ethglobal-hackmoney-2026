# Spec 123: Protocol and aggregator constants

**Status:** Complete

## Summary

All protocol-related enums, types, and lookups live in `src/constants/protocols.ts`. The file follows the pattern from Spec 045: enums as discriminants, one canonical array per concept, derived mappings only. Swap aggregator/strategy logic and UI read from these constants; no hardcoded branches for aggregator ids or strategy lists.

## Model

### Protocol (first-class protocols: UniswapV4, LiFi, Odos, …)

- **ProtocolId** (enum): Discriminant for a supported protocol (Cctp, CircleGateway, KyberSwap, LiFi, NearIntents, Odos, PartyKit, Relay, UniswapV4, Yellow).
- **Protocol** (type): `{ id: ProtocolId; label: string; icon: string; detail: string }`.
- **protocols**: `readonly Protocol[]` — canonical array.
- **protocolsById**: `Record<ProtocolId, Protocol>` — derived from `protocols`.

### Protocol aggregator (quote source for swap: Spandex / None)

- **ProtocolAggregatorId** (enum): Quote source id — `None`, `Spandex`.
- **ProtocolAggregator** (type): `{ id: ProtocolAggregatorId; label: string; strategies: readonly ProtocolStrategy[] }`. Strategies supported by this aggregator (e.g. Spandex → [BestPrice, Fastest, EstimatedGas]; None → []).
- **protocolAggregators**: `readonly ProtocolAggregator[]` — canonical array.
- **protocolAggregatorsById**: `Record<ProtocolAggregatorId, ProtocolAggregator>` — derived.
- **protocolAggregatorIds**: `readonly ProtocolAggregatorId[]` — order for UI (e.g. dropdown). Swap param defaults (Spandex, BestPrice) are defined where used (actions.ts schema, Action.svelte / SwapProtocolFieldset fallbacks, api/spandex and SwapQuotes default args).

### Protocol strategy (how to choose among protocols when using an aggregator)

- **ProtocolStrategy** (enum): `BestPrice`, `Fastest`, `EstimatedGas`.
- **protocolStrategies**: Array of `{ id: ProtocolStrategy; label: string }`. Labels via `.find((d) => d.id === s)?.label` where needed.

## Swap params and UI (see Spec 109)

- Swap params: `swapAggregator: ProtocolAggregatorId` (default in actions.ts), `swapStrategy: ProtocolStrategy` (default in actions.ts). Fallbacks in components and default args in API/collections use the same enum values where needed.
- **SwapProtocolFieldset**: Aggregator dropdown uses `protocolAggregatorIds` and `protocolAggregatorsById`; Strategy dropdown uses `protocolAggregatorsById[swapAggregator].strategies` (shown when length > 0). No Spandex-specific enum checks.
- **Action.svelte**: Quote section visibility uses the aggregator object only: `swapShowsQuoteSection` = `(protocolAggregatorsById[swapAggregator]?.strategies.length ?? 0) > 0 && (protocol/intent condition)`.

## Other files

- **protocol-aggregator-quote-strategies.ts**: Only exports `protocolStrategyQuoteMetric` (ProtocolStrategy → quote sort metric for spanDEX). Strategy list for an aggregator comes from `protocolAggregatorsById[id].strategies` in protocols.ts.
- **actions.ts**: Swap param schema defaults: `ProtocolAggregatorId.Spandex`, `ProtocolStrategy.BestPrice`.

## References

- Spec 045 (schema + constants preferences), Spec 109 (swap/spanDEX)
- `src/constants/protocols.ts`, `src/constants/protocol-aggregator-quote-strategies.ts`
