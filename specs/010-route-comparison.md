# Spec 010: Route comparison UI

Show multiple bridge route options instead of a single quote, letting users choose
based on speed, fees, and output amount.

**References:**

- https://docs.li.fi/introduction/user-flows-and-examples/requesting-route-fetching-quote
- https://docs.li.fi/introduction/user-flows-and-examples/difference-between-quote-and-route

## Design decision

Switch from `getQuote()` (single executable step) to `getRoutes()` (multiple options)
for the initial fetch. User selects preferred route, then execute that route directly.

**Note:** LI.FI's `getRoutes()` returns `Route[]` where each `Route` contains `steps[]`.
The route can be executed directly with `executeRoute()`.

## Requirements

1. **Fetch multiple routes:**
   - Call `getRoutes()` with params including slippage
   - Display up to 5 route options
   - Handle "no routes found" gracefully

2. **Route card display:**
   - Estimated output amount (human-readable)
   - Total gas fees in USD or native token
   - Bridge protocol name(s) (e.g., "Stargate", "Across", "CCTP")
   - Estimated time (e.g., "~2 min", "~15 min")
   - Number of steps if >1
   - Tags: "Best", "Cheapest", "Fastest"

3. **Route selection:**
   - First route auto-selected (usually best)
   - Click to select different route
   - Selected route highlighted with border
   - Keyboard accessible (arrow keys, Enter)

4. **Sort/filter options:**
   - Best output (default)
   - Lowest fees
   - Fastest
   - Filter toggle: "Show all" / "Direct only" (single-step routes)

## Implementation

### `src/api/lifi.ts` additions

```typescript
import { getRoutes, executeRoute } from '@lifi/sdk'
import type { Route, RouteExtended } from '@lifi/sdk'

export type NormalizedRoute = {
  id: string
  originalRoute: Route // Keep for execution
  steps: {
    tool: string // e.g., "stargate", "across"
    toolName: string // e.g., "Stargate", "Across Protocol"
    type: BridgeRouteStepType  // enum: Bridge | Swap | Cross (src/data/BridgeRoute.ts)
    fromChainId: number
    toChainId: number
    fromAmount: string
    toAmount: string
  }[]
  fromChainId: number
  toChainId: number
  fromAmount: string
  toAmount: string
  toAmountMin: string // After slippage
  gasCostUsd: string
  estimatedDurationSeconds: number
  tags: ('BEST' | 'CHEAPEST' | 'FASTEST')[]
}

export const getRoutesForUsdcBridge = async (
  params: QuoteParams,
): Promise<NormalizedRoute[]> => {
  const { fromChain, toChain, fromAmount, fromAddress, slippage = 0.005 } = params

  const result = await getRoutes({
    fromChainId: fromChain,
    toChainId: toChain,
    fromTokenAddress: getUsdcAddress(fromChain),
    toTokenAddress: getUsdcAddress(toChain),
    fromAmount,
    fromAddress,
    options: {
      slippage,
      order: 'RECOMMENDED',
      maxPriceImpact: 0.1, // 10% max price impact
    },
  })

  return result.routes.slice(0, 5).map(normalizeRoute)
}

export const normalizeRoute = (route: Route): NormalizedRoute => ({
  id: route.id,
  originalRoute: route,
  steps: route.steps.map(step => ({
    tool: step.tool,
    toolName: step.toolDetails?.name ?? step.tool,
    type: mapped from step.type to BridgeRouteStepType (Bridge | Swap | Cross),
    fromChainId: step.action.fromChainId,
    toChainId: step.action.toChainId,
    fromAmount: step.action.fromAmount,
    toAmount: step.action.toAmount ?? step.estimate.toAmount,
  })),
  fromChainId: route.fromChainId,
  toChainId: route.toChainId,
  fromAmount: route.fromAmount,
  toAmount: route.toAmount,
  toAmountMin: route.toAmountMin,
  gasCostUsd: route.gasCostUSD ?? '0',
  estimatedDurationSeconds: route.steps.reduce(
    (sum, s) => sum + (s.estimate.executionDuration ?? 0),
    0
  ),
  tags: route.tags ?? [],
})

export const executeSelectedRoute = async (
  providerDetail: ProviderDetailType,
  route: NormalizedRoute,
  onStatusChange?: StatusCallback,
): Promise<RouteExtended> => {
  // Set up providers as in existing executeQuote
  lifiConfig.setProviders([
    EVM({
      getWalletClient: () =>
        Promise.resolve(createWalletClientForChain(
          providerDetail.provider,
          route.fromChainId
        )),
      switchChain: async (chainId) => {
        await switchWalletChain(providerDetail.provider, chainId)
        return createWalletClientForChain(providerDetail.provider, chainId)
      },
    }),
  ])

  return executeRoute(route.originalRoute, {
    updateRouteHook: onStatusChange
      ? (updatedRoute) => {
          // Map to BridgeStatus and call onStatusChange
        }
      : undefined,
  })
}
```

### Route list and cards in `src/routes/bridge/lifi/BridgeFlow.svelte`

Routes are rendered inline in BridgeFlow rather than separate components. The
implementation uses:

- `bridgeRoutesCollection` via TanStack DB `useLiveQuery`
- `sortedRoutes` derived from settings sort preference
- `selectedRouteId` state for selection
- Auto-select first route via `$effect`

```svelte
<!-- Routes list -->
{#if sortedRoutes.length > 0 || routesRow?.isLoading}
  <section data-card data-column>
    <div data-row="gap-2 align-center justify-between">
      <h3>Routes {routesRow?.isLoading ? '(loading…)' : `(${sortedRoutes.length})`}</h3>
      <Select.Root ...>Sort: {settings.sortBy}</Select.Root>
    </div>

    <div data-column="gap-2">
      {#each sortedRoutes as r (r.id)}
        <button type="button" data-route-card data-selected={r.id === selectedRouteId ? '' : undefined}
          onclick={() => { selectedRouteId = r.id }}>
          <div data-row="gap-2 align-center justify-between">
            <strong>{formatTokenAmount(r.toAmount, 6)} USDC</strong>
            <span data-text="muted">${r.gasCostUsd.toFixed(2)} fees</span>
          </div>
          <div data-row="gap-2" data-text="muted">
            <span>{[...new Set(r.steps.map((st) => st.toolName))].join(' → ')}</span>
            <span>~{Math.ceil(r.estimatedDurationSeconds / 60)}m</span>
          </div>
        </button>
      {/each}
    </div>
  </section>
{/if}
```

### Sort controls

```svelte
<script lang="ts">
  import { Select } from 'bits-ui'

  let sortBy = $state<'recommended' | 'output' | 'fees' | 'speed'>('recommended')

  const sortedRoutes = $derived(
    [...routes].sort((a, b) => {
      switch (sortBy) {
        case 'output':
          return BigInt(b.toAmount) > BigInt(a.toAmount) ? 1 : -1
        case 'fees':
          return parseFloat(a.gasCostUsd) - parseFloat(b.gasCostUsd)
        case 'speed':
          return a.estimatedDurationSeconds - b.estimatedDurationSeconds
        default:
          return 0 // Keep original order (recommended)
      }
    })
  )
</script>

<Select.Root bind:value={sortBy}>
  <Select.Trigger>Sort: {sortBy}</Select.Trigger>
  <Select.Content>
    <Select.Item value="recommended">Recommended</Select.Item>
    <Select.Item value="output">Best output</Select.Item>
    <Select.Item value="fees">Lowest fees</Select.Item>
    <Select.Item value="speed">Fastest</Select.Item>
  </Select.Content>
</Select.Root>
```

## Acceptance criteria

### API functions
- [x] `getRoutesForUsdcBridge()` returns array of `NormalizedRoute`
- [x] Routes include `originalRoute` for execution
- [x] `normalizeRoute()` extracts tool names, durations, tags
- [x] `executeSelectedRoute()` executes the chosen route

### Route list (inline in BridgeFlow)
- [x] Shows up to 5 routes
- [x] First route auto-selected
- [x] "No routes available" shown when empty (via routesRow.error)
- [x] Loading state shows "(loading…)" in header
- [x] Click to select routes

### Route cards (inline in BridgeFlow)
- [x] Displays output amount (human-readable)
- [x] Shows bridge/protocol name(s)
- [x] Shows estimated time
- [x] Shows gas cost in USD
- [x] Selected state visually distinct via `data-selected`

### Sorting
- [x] Sort dropdown with 4 options
- [x] "Recommended" keeps original order
- [x] "Best output" sorts by toAmount descending
- [x] "Lowest fees" sorts by gasCostUsd ascending
- [x] "Fastest" sorts by duration ascending

### Integration
- [x] Bridge page fetches routes instead of single quote
- [x] Selected route used for execution
- [x] Route selection persists until new fetch

## Status

Complete. Re-verification 2026-02-07 (PROMPT_build execute one spec, re-verify 010): all 21 AC confirmed (lifi.ts getRoutesForUsdcBridge/normalizeRoute/executeSelectedRoute/NormalizedRoute; BridgeFlow sortedRoutes, selectedRouteId, first-route auto-select, route cards, sort, loading, no-routes); test:unit 44 Deno + 159 Vitest passed.
Previous: Re-verification 2026-02-07 (PROMPT_build execute one spec, no incomplete specs; re-verify 010): all 21 AC confirmed—lifi.ts getRoutesForUsdcBridge/normalizeRoute/executeSelectedRoute/NormalizedRoute with originalRoute; bridge-routes.ts uses getRoutesForUsdcBridge; BridgeFlow.svelte sortedRoutes, selectedRouteId, first-route auto-select, route cards (output amount, tool names, time, gas USD, data-selected), Sort dropdown (Recommended/Output/Fees/Speed), loading state; BridgeExecution uses executeSelectedRoute. test:unit 44 Deno + 159 Vitest passed. Previous: `src/api/lifi.ts`: getRoutesForUsdcBridge, normalizeRoute, executeSelectedRoute. Routes fetched into `bridgeRoutesCollection`, displayed inline in BridgeFlow.svelte. Sort dropdown persisted via `bridgeSettingsState.sortBy`. Selected route used for approval check and execution via TokenApproval and BridgeExecution components.

## Output when complete

`DONE`
