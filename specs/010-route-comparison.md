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
    type: 'bridge' | 'swap' | 'cross'
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
    type: step.type as 'bridge' | 'swap' | 'cross',
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

### `src/routes/bridge/RouteList.svelte`

```svelte
<script lang="ts">
  import type { NormalizedRoute } from '$/api/lifi'
  import RouteCard from './RouteCard.svelte'

  let {
    routes,
    selectedId = $bindable<string | null>(null),
    loading = false,
  }: {
    routes: NormalizedRoute[]
    selectedId?: string | null
    loading?: boolean
  } = $props()

  // Auto-select first route
  $effect(() => {
    if (routes.length > 0 && selectedId === null) {
      selectedId = routes[0].id
    }
  })

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' && index < routes.length - 1) {
      selectedId = routes[index + 1].id
      e.preventDefault()
    } else if (e.key === 'ArrowUp' && index > 0) {
      selectedId = routes[index - 1].id
      e.preventDefault()
    }
  }
</script>

<div data-route-list role="listbox" aria-label="Bridge routes">
  {#if loading}
    <p data-route-loading>Finding best routes…</p>
  {:else if routes.length === 0}
    <p data-route-empty>No routes available for this transfer.</p>
  {:else}
    {#each routes as route, i (route.id)}
      <RouteCard
        {route}
        selected={selectedId === route.id}
        onclick={() => { selectedId = route.id }}
        onkeydown={(e) => handleKeyDown(e, i)}
      />
    {/each}
  {/if}
</div>

<style>
  [data-route-list] {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }
</style>
```

### `src/routes/bridge/RouteCard.svelte`

```svelte
<script lang="ts">
  import type { NormalizedRoute } from '$/api/lifi'
  import { formatTokenAmount } from '$/lib/format'

  let {
    route,
    selected = false,
    onclick,
    onkeydown,
  }: {
    route: NormalizedRoute
    selected?: boolean
    onclick: () => void
    onkeydown?: (e: KeyboardEvent) => void
  } = $props()

  const bridgeNames = $derived(
    [...new Set(route.steps.map(s => s.toolName))].join(' → ')
  )

  const formatDuration = (seconds: number) => (
    seconds < 60 ? `~${seconds}s`
    : seconds < 3600 ? `~${Math.ceil(seconds / 60)} min`
    : `~${Math.ceil(seconds / 3600)} hr`
  )
</script>

<button
  type="button"
  role="option"
  aria-selected={selected}
  data-route-card
  data-selected={selected ? '' : undefined}
  {onclick}
  {onkeydown}
>
  <div data-route-header>
    <span data-route-output>
      {formatTokenAmount(route.toAmount, 6)} USDC
    </span>
    {#if route.tags.includes('BEST')}
      <span data-route-tag="best">Best</span>
    {:else if route.tags.includes('CHEAPEST')}
      <span data-route-tag="cheapest">Cheapest</span>
    {:else if route.tags.includes('FASTEST')}
      <span data-route-tag="fastest">Fastest</span>
    {/if}
  </div>

  <div data-route-details>
    <span data-route-bridge>{bridgeNames}</span>
    <span data-route-time>{formatDuration(route.estimatedDurationSeconds)}</span>
    <span data-route-gas>~${parseFloat(route.gasCostUsd).toFixed(2)} gas</span>
  </div>

  {#if route.steps.length > 1}
    <div data-route-steps>
      {route.steps.length} steps
    </div>
  {/if}
</button>

<style>
  [data-route-card] {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 1em;
    border: 1px solid var(--color-border);
    border-radius: 0.5em;
    background: var(--color-bg-card);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s;
  }

  [data-route-card]:hover,
  [data-route-card]:focus-visible {
    border-color: var(--color-primary);
  }

  [data-route-card][data-selected] {
    border-color: var(--color-primary);
    background: var(--color-bg-card-selected, var(--color-bg-card));
  }

  [data-route-header] {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  [data-route-output] {
    font-size: 1.125em;
    font-weight: 600;
  }

  [data-route-tag] {
    font-size: 0.75em;
    padding: 0.25em 0.5em;
    border-radius: 0.25em;
    text-transform: uppercase;
  }

  [data-route-tag="best"] {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #22c55e);
  }

  [data-route-tag="cheapest"] {
    background: var(--color-info-bg, #dbeafe);
    color: var(--color-info, #3b82f6);
  }

  [data-route-tag="fastest"] {
    background: var(--color-warning-bg, #fef3c7);
    color: var(--color-warning, #f59e0b);
  }

  [data-route-details] {
    display: flex;
    gap: 1em;
    font-size: 0.875em;
    opacity: 0.8;
  }

  [data-route-steps] {
    font-size: 0.75em;
    opacity: 0.6;
  }
</style>
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
- [ ] `getRoutesForUsdcBridge()` returns array of `NormalizedRoute`
- [ ] Routes include `originalRoute` for execution
- [ ] `normalizeRoute()` extracts tool names, durations, tags
- [ ] `executeSelectedRoute()` executes the chosen route

### RouteList component
- [ ] Shows up to 5 routes
- [ ] First route auto-selected
- [ ] "No routes available" shown when empty
- [ ] Loading state shows "Finding best routes…"
- [ ] Keyboard navigation (arrow keys) works

### RouteCard component
- [ ] Displays output amount (human-readable)
- [ ] Shows bridge/protocol name(s)
- [ ] Shows estimated time
- [ ] Shows gas cost in USD
- [ ] Tags displayed: Best, Cheapest, Fastest
- [ ] Selected state visually distinct
- [ ] Multi-step routes show step count

### Sorting
- [ ] Sort dropdown with 4 options
- [ ] "Recommended" keeps original order
- [ ] "Best output" sorts by toAmount descending
- [ ] "Lowest fees" sorts by gasCostUsd ascending
- [ ] "Fastest" sorts by duration ascending

### Integration
- [ ] Bridge page fetches routes instead of single quote
- [ ] Selected route used for execution
- [ ] Route selection persists until new fetch

## Status

Not started.

## Output when complete

`DONE`
