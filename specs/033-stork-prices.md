# Stork price subscriptions

## Summary
- Subscribe to Stork USD price feeds for supported tokens.
- Store price updates in TanStack DB.
- Surface Stork prices in balances (net worth) and swap (price comparison).

## Goals
- Support REST, websocket, and direct JSON-RPC reads (via Voltaire + contract address).
- Provide a reusable view component for Stork price status and latest values.
- Keep the UI resilient when a transport is unavailable.

## Non-goals
- Building a custom backend proxy for Stork auth headers.
- Persisting price history beyond the current session.

## Implementation
- Add a `stork-prices` TanStack DB collection keyed by asset id + transport (+ chain for RPC).
- Normalize Stork prices to `bigint` with 1e18 scale and timestamps in ns.
- REST transport uses Stork `/v1/prices/latest` with `PUBLIC_STORK_REST_TOKEN`.
- Websocket transport connects to Stork `/evm/subscribe` and handles subscribe/unsubscribe messages.
- RPC transport queries `getTemporalNumericValueV1(bytes32)` via Voltaire using Stork contract addresses.
- Map token symbols to Stork asset ids + encoded asset ids for on-chain reads.
- Add `StorkPrices.svelte` in `src/views/` to show price rows and transport status.
- Use Stork prices in balances to compute net worth in USD.
- Use Stork prices in swap to compare the implied quote rate vs Stork USD prices.

## Acceptance criteria
- [x] A new spec file exists at `specs/033-stork-prices.md` with the content above.
- [x] `stork-prices` TanStack DB collection stores REST, websocket, and RPC price rows.
- [x] REST transport uses Stork REST latest prices with auth token.
- [x] Websocket transport subscribes to asset ids and updates prices on incoming messages.
- [x] RPC transport reads on-chain prices using Voltaire + Stork contract address.
- [x] `src/views/StorkPrices.svelte` renders latest Stork prices with transport metadata.
- [x] Balances view shows net worth computed from Stork prices.
- [x] Swap view shows a price comparison using Stork prices for token in/out.

## Status

Complete. `src/collections/stork-prices.ts`: stork-prices collection with REST (PUBLIC_STORK_REST_TOKEN), websocket (evm/subscribe), and RPC (getTemporalNumericValueV1 via Voltaire). `src/views/StorkPrices.svelte`: latest prices and transport metadata. CoinBalances: net worth from Stork in `src/views/CoinBalances.svelte`, with `CoinAmount.svelte` surfacing StorkPriceFeed tooltip per token. Swap: Stork vs quote rate comparison in SwapFlow.svelte.

## Output when complete

`DONE`
