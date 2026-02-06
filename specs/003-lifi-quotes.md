# Spec 003: LI.FI quotes

Integrate LI.FI SDK to fetch executable quotes for USDC bridging across
supported chains.

**References:**

- https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example
- https://docs.li.fi/introduction/user-flows-and-examples/requesting-route-fetching-quote
- https://docs.li.fi/introduction/user-flows-and-examples/difference-between-quote-and-route

## Design decision

**Routes-first approach:** This implementation uses `getRoutes()` to fetch
multiple route options and execute the selected route. Per LI.FI docs:

- Route = planning step, returns array of route options
- Quote = executable transaction with tool data for one specific route

Quotes remain available for single-step flows, but the bridge UI uses routes to
enable comparison and execution.

## Implementation

`src/api/lifi.ts` exports:

**Types:**
- `NormalizedRoute` – normalized route with toolName, duration, amounts, fees
- `FeeBreakdown` – gas costs, protocol fees, total USD, percent of transfer
- `StatusCallback` – callback for execution status updates

**Functions:**
- `getLifiSdk()` – lazy-load LI.FI SDK
- `getRoutesForUsdcBridge(params)` – fetch routes for USDC transfer
- `normalizeRoute(route)` – transform LI.FI Route to normalized shape
- `extractFeeBreakdown(route)` – extract detailed fee info from route
- `fetchBridgeRoutes(params)` – fetch and store routes in bridgeRoutesCollection
- `executeSelectedRoute(providerDetail, route, onStatusChange?)` – execute route with status updates

## Acceptance criteria

- [x] `src/api/lifi.ts` exists with exports above.
- [x] `getRoutesForUsdcBridge({ fromChain, toChain, fromAmount, fromAddress, toAddress, slippage })`
      fetches routes via LI.FI SDK.
- [x] Routes normalized to `NormalizedRoute` shape with toolName, amounts, fees.
- [x] USDC addresses are looked up from `src/constants/coins.ts` by chain ID.
- [x] `fetchBridgeRoutes` uses TanStack Query for caching and stores in collection.
- [x] `executeSelectedRoute` handles wallet provider, chain switching, execution.
- [x] `extractFeeBreakdown` provides detailed gas and protocol fee info.
- [x] Unit test (`src/api/lifi.spec.ts`) mocks LI.FI response and asserts
      normalized shape.

## Status

Complete. Re-verification 2026-02-06 (PROMPT_build execute one spec): re-verified 003; all 8 AC (lifi.ts: StatusCallback, FeeBreakdown, NormalizedRoute, getLifiSdk internal, getRoutesForUsdcBridge with queryClient.fetchQuery, normalizeRoute, extractFeeBreakdown, executeSelectedRoute; USDC from ercTokensBySymbolByChainId; fetchBridgeRoutes in bridge-routes.ts calls getRoutesForUsdcBridge and stores in bridgeRoutesCollection; lifi.spec.ts mocks LI.FI and asserts normalized shape). test:unit 44 Deno + 101 Vitest passed.

## Output when complete

`DONE`
