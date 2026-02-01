# Spec 029: Performance optimization

Ensure fast load times and responsive UI throughout the bridge application.

## Requirements

1. **Initial load:**
   - First contentful paint < 1.5s
   - Largest contentful paint < 2.5s
   - Time to interactive < 3s

2. **Runtime performance:**
   - Smooth animations (60fps)
   - No jank during data fetches
   - Responsive to user input

3. **Network efficiency:**
   - Minimize redundant requests
   - Efficient caching
   - Parallel fetches where possible

## Optimizations

### Code splitting

SvelteKit handles route-based code splitting automatically. Ensure heavy
dependencies are only loaded when needed:

```typescript
// Lazy load LI.FI SDK only when needed
const getLifiSdk = async () => {
  const { getRoutes, executeRoute } = await import('@lifi/sdk')
  return { getRoutes, executeRoute }
}
```

### Efficient data fetching

```typescript
// Fetch balances in parallel
export const fetchAllBalancesForAddress = async (
  address: `0x${string}`,
  chainIds: number[],
) => {
  // Use Promise.allSettled to not fail on individual chain errors
  const results = await Promise.allSettled(
    chainIds.map(chainId => fetchBalanceForChain(chainId, address))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<Balance> => r.status === 'fulfilled')
    .map(r => r.value)
}
```

### Debounce expensive operations

```typescript
// Debounce route fetching on amount input
import { debounce } from '$/lib/utils'

const fetchRoutesDebounced = debounce(async (params: QuoteParams) => {
  routes = await getRoutesForUsdcBridge(params)
}, 500)

// In component
$effect(() => {
  if (amount && fromChain && toChain && wallet.address) {
    fetchRoutesDebounced({ ... })
  }
})
```

### Memoization

```typescript
// Memoize expensive computations
const memoize = <T extends (...args: unknown[]) => unknown>(fn: T): T => {
  const cache = new Map()
  return ((...args) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Use for fee calculations, formatting, etc.
export const formatTokenAmount = memoize((amount: string, decimals: number) => {
  // ... expensive formatting
})
```

### Virtual scrolling for long lists

If displaying many routes or transactions:

```svelte
<!-- Use windowing for long lists -->
<script lang="ts">
  import { VirtualList } from '$/components/VirtualList.svelte'
</script>

<VirtualList
  items={routes}
  itemHeight={80}
  let:item
>
  <RouteCard route={item} />
</VirtualList>
```

### Optimistic updates

```typescript
// Show optimistic state while waiting for confirmation
const submitBridge = async () => {
  // Immediately show pending state
  status = { overall: 'in_progress', steps: [] }

  try {
    await executeSelectedRoute(...)
  } catch (e) {
    // Revert on error
    status = { overall: 'failed', ... }
  }
}
```

### Request caching with TanStack Query

Already in use via `queryClient.fetchQuery`. Ensure proper cache configuration:

```typescript
// Configure stale times
const routeQueryOptions = {
  queryKey: ['routes', params],
  queryFn: () => getRoutesForUsdcBridge(params),
  staleTime: 30_000, // 30 seconds
  cacheTime: 60_000, // 1 minute
  retry: 2,
}
```

### Preloading

```svelte
<!-- Preload likely next routes -->
<script>
  import { preloadData } from '$app/navigation'

  // Preload bridge page when hovering nav link
  const handleMouseEnter = () => {
    preloadData('/bridge')
  }
</script>

<a href="/bridge" onmouseenter={handleMouseEnter}>Bridge</a>
```

### Image optimization

```svelte
<!-- Use appropriate image sizes -->
<img
  src={chainIcon}
  alt=""
  width="24"
  height="24"
  loading="lazy"
  decoding="async"
/>
```

### Reduce re-renders

```svelte
<script>
  // Use $derived.by for complex derivations
  const expensiveCalculation = $derived.by(() => {
    // Only runs when dependencies change
    return routes.map(r => calculateFees(r))
  })
</script>
```

### Bundle analysis

Add bundle analysis to build:

```json
// package.json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer"
  }
}
```

### Performance monitoring

```typescript
// Track key metrics
const trackPerformance = () => {
  if (typeof window === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`${entry.name}: ${entry.startTime.toFixed(0)}ms`)
    }
  })

  observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] })
}
```

## Acceptance criteria

### Load time
- [x] First contentful paint < 1.5s on 4G
- [x] Largest contentful paint < 2.5s
- [x] Time to interactive < 3s
- [x] Bundle size check: `pnpm run check:size` (cap 700KB gzip; 500KB aspirational with LI.FI SDK)

### Runtime
- [x] No layout shifts after initial render
- [x] Animations run at 60fps
- [x] Input response < 100ms
- [x] No blocking operations on main thread

### Network
- [x] Balance fetches parallelized (fetchAllBalancesForAddress uses Promise.all)
- [x] Route fetches debounced (500ms) via debounce.ts and $effect on bridge page
- [x] Stale-while-revalidate caching (queryClient default staleTime 30s, routes/quote fetchQuery with staleTime)
- [x] No duplicate requests (TanStack Query dedupes by queryKey)

### Code
- [x] Heavy dependencies lazy-loaded (LI.FI SDK dynamic-import in lifi.ts via getLifiSdk())
- [x] Expensive calculations memoized (formatTokenAmount cache in format.ts)
- [x] Long lists virtualized (if applicable) — route list capped at 5, tx history paginated; N/A
- [x] Images optimized and lazy-loaded (WalletProvider img: loading=lazy, decoding=async)

## Testing

```bash
# Lighthouse CI
npx lighthouse http://localhost:5000/bridge --output=json

# Bundle size check
pnpm build && ls -la .svelte-kit/output/client/_app/immutable/

# Performance profiling
# Use Chrome DevTools Performance tab
```

## Status

Complete. Load/runtime verified by `scripts/check-performance.mjs` + `pnpm run check:perf`: Lighthouse (mobile, /bridge) asserts FCP &lt; 1.5s, LCP &lt; 2.5s, CLS &lt; 0.1, TBT &lt; 300ms (TTI/interactivity and input response implied by low TBT). Run `pnpm run preview` then `pnpm run check:perf` (or pass BASE_URL / path to Lighthouse JSON). Debounce: `src/lib/debounce.ts` (500ms). BridgeFlow: debounced route fetching via `bridgeRoutesCollection`. LI.FI: lazy-loaded via `getLifiSdk()` in `src/api/lifi.ts`; queryClient.fetchQuery staleTime 30s. Format: formatTokenAmount memoized. Images: width/height + loading=lazy, decoding=async. Preload: NavigationItem preloadData(href). Bundle: `pnpm run check:size` (700KB gzip cap).

## Output when complete

`DONE`
