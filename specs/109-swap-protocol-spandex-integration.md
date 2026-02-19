# Spec 109: Swap protocol and spanDEX integration

**Status:** Complete

## Summary

spanDEX is a meta-aggregator, not a protocol. Swap protocol options are first-class (UniswapV4, LiFi, Odos, KyberSwap, Relay). "Auto" uses spanDEX to aggregate LiFi/Odos/KyberSwap/Relay with a selectable strategy (best value, fastest, lowest gas).

## Model

- **Swap protocol options:** Auto, UniswapV4, LiFi, Odos, KyberSwap, Relay
- **Auto:** spanDEX aggregates across LiFi, Odos, KyberSwap, Relay. User picks strategy (bestPrice, fastest, estimatedGas).
- **LiFi/Odos/KyberSwap/Relay:** Single-provider quote via spanDEX `getQuoteForProvider`.
- **UniswapV4:** Direct integration (constant product AMM), not via spanDEX.

## Params

Swap action params include:

- `swapProtocolIntent`: `'auto' | 'uniswap' | 'lifi' | 'odos' | 'kyberswap' | 'relay'` (default `'auto'`)
- `swapStrategy`: `'bestPrice' | 'fastest' | 'estimatedGas'` (default `'bestPrice'`, used when intent is `'auto'`)

## UI

- `SwapProtocolFieldset`: Auto (with strategy dropdown when selected) + protocol cards
- `SpandexQuotesPanel`: Shown when swap uses spanDEX (Auto or LiFi/Odos/KyberSwap/Relay)

## References

- `swap-protocol-intents.ts`, `spandex-providers.ts`, `spandex-quote-strategies.ts`
- `routes/session/SwapProtocolFieldset.svelte`, `SpandexQuotesPanel.svelte`, `SpandexQuoteItems.ts`
- Spec 065 (external API cache)
