# Spec 003: LI.FI quotes

Integrate LI.FI SDK to fetch executable quotes for USDC bridging across supported chains.

**References:**
- https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example
- https://docs.li.fi/introduction/user-flows-and-examples/requesting-route-fetching-quote
- https://docs.li.fi/introduction/user-flows-and-examples/difference-between-quote-and-route

## Design decision

**Quote-only approach:** This implementation uses `getQuote()` (single executable step) rather than `getRoutes()` (multiple options). Per LI.FI docs:
- Route = planning step, returns array of route options
- Quote = executable transaction with tool data for one specific route

For a minimal USDC bridge, quote-only is sufficient. Routes could be added later for route comparison UI.

## Implementation

`src/lib/lifi.ts` exports:
- `NormalizedQuote` type: `{ steps, fromChainId, toChainId, fromAmount, toAmount, estimatedToAmount, fees }`
- `normalizeQuote(step)` – transform LI.FI `LiFiStep` to normalized shape
- `getQuoteForUsdcBridge(params)` – fetch quote for USDC transfer
- `fetchQuoteCached(params)` – TanStack Query wrapper with caching

## Acceptance criteria

- [x] `src/lib/lifi.ts` exists with exports above.
- [x] `getQuoteForUsdcBridge({ fromChain, toChain, fromAmount, fromAddress })` fetches quote via LI.FI SDK.
- [x] Quote is normalized to `NormalizedQuote` shape with steps, amounts, fees.
- [x] USDC addresses are looked up from `src/constants/coins.ts` by chain ID.
- [x] `fetchQuoteCached` uses TanStack Query for caching.
- [x] Unit test (`src/lib/lifi.spec.ts`) mocks LI.FI response and asserts normalized shape.

## Status

Complete.

## Output when complete

` DONE `
