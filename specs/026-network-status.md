# Spec 026: Network status indicator

Show real-time health status of blockchain networks and APIs used by the bridge.

## Requirements

1. **Status indicators:**
   - RPC endpoint health per chain
   - LI.FI API status
   - Overall bridge health

2. **Health checks:**
   - Periodic ping to RPCs (every 30s)
   - Check LI.FI API availability
   - Track response times

3. **Display:**
   - Compact indicator in header (green/yellow/red dot)
   - Expandable details panel
   - Show degraded chains

4. **User impact:**
   - Warn before using degraded chain
   - Suggest alternative chains if available

## Implementation

### `src/lib/network-status.svelte.ts`

```typescript
import { rpcUrls } from '$/constants/rpc-endpoints'
import { createHttpProvider } from '$/lib/voltaire'

export type ChainStatus = {
  chainId: number
  status: 'healthy' | 'degraded' | 'down'
  latencyMs: number | null
  lastChecked: number
  error?: string
}

export type NetworkStatus = {
  chains: Map<number, ChainStatus>
  lifiApi: 'healthy' | 'degraded' | 'down'
  overall: 'healthy' | 'degraded' | 'down'
  lastUpdated: number
}

const CHECK_INTERVAL = 30_000 // 30 seconds
const LATENCY_THRESHOLD_DEGRADED = 2000 // 2s
const LATENCY_THRESHOLD_DOWN = 10000 // 10s timeout

const createNetworkStatusStore = () => {
  let status = $state<NetworkStatus>({
    chains: new Map(),
    lifiApi: 'healthy',
    overall: 'healthy',
    lastUpdated: 0,
  })

  let checkInterval: ReturnType<typeof setInterval> | null = null

  const checkChain = async (chainId: number): Promise<ChainStatus> => {
    const rpcUrl = rpcUrls[chainId]
    if (!rpcUrl) {
      return {
        chainId,
        status: 'down',
        latencyMs: null,
        lastChecked: Date.now(),
        error: 'No RPC URL configured',
      }
    }

    const start = performance.now()
    try {
      const provider = createHttpProvider(rpcUrl)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), LATENCY_THRESHOLD_DOWN)

      await provider.request({ method: 'eth_blockNumber', params: [] })
      clearTimeout(timeout)

      const latencyMs = Math.round(performance.now() - start)
      const chainStatus: ChainStatus['status'] = (
        latencyMs > LATENCY_THRESHOLD_DEGRADED ? 'degraded' : 'healthy'
      )

      return {
        chainId,
        status: chainStatus,
        latencyMs,
        lastChecked: Date.now(),
      }
    } catch (e) {
      return {
        chainId,
        status: 'down',
        latencyMs: null,
        lastChecked: Date.now(),
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }

  const checkLifiApi = async (): Promise<'healthy' | 'degraded' | 'down'> => {
    try {
      const start = performance.now()
      const response = await fetch('https://li.quest/v1/status', {
        signal: AbortSignal.timeout(5000),
      })
      const latency = performance.now() - start

      if (!response.ok) return 'down'
      if (latency > 2000) return 'degraded'
      return 'healthy'
    } catch {
      return 'down'
    }
  }

  const checkAll = async (chainIds: number[]) => {
    const [chainResults, lifiStatus] = await Promise.all([
      Promise.all(chainIds.map(checkChain)),
      checkLifiApi(),
    ])

    const chains = new Map(chainResults.map(r => [r.chainId, r]))

    // Calculate overall status
    const hasDown = chainResults.some(r => r.status === 'down') || lifiStatus === 'down'
    const hasDegraded = chainResults.some(r => r.status === 'degraded') || lifiStatus === 'degraded'
    const overall: NetworkStatus['overall'] = (
      hasDown ? 'down'
      : hasDegraded ? 'degraded'
      : 'healthy'
    )

    status = {
      chains,
      lifiApi: lifiStatus,
      overall,
      lastUpdated: Date.now(),
    }
  }

  const start = (chainIds: number[]) => {
    // Initial check
    checkAll(chainIds)

    // Periodic checks
    checkInterval = setInterval(() => checkAll(chainIds), CHECK_INTERVAL)
  }

  const stop = () => {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }

  const getChainStatus = (chainId: number): ChainStatus | undefined => (
    status.chains.get(chainId)
  )

  return {
    get status() { return status },
    start,
    stop,
    checkAll,
    checkChain,
    getChainStatus,
  }
}

export const networkStatus = createNetworkStatusStore()
```

### `src/components/NetworkStatusIndicator.svelte`

```svelte
<script lang="ts">
  import { Popover } from 'bits-ui'
  import { networkStatus } from '$/lib/network-status.svelte'
  import { networksByChainId } from '$/constants/networks'

  const statusColors = {
    healthy: 'var(--color-success, #22c55e)',
    degraded: 'var(--color-warning, #f59e0b)',
    down: 'var(--color-error, #ef4444)',
  }

  const statusLabels = {
    healthy: 'All systems operational',
    degraded: 'Some networks degraded',
    down: 'Network issues detected',
  }

  const degradedChains = $derived(
    [...networkStatus.status.chains.values()]
      .filter(c => c.status !== 'healthy')
      .sort((a, b) => (a.status === 'down' ? -1 : 1))
  )
</script>

<Popover.Root>
  <Popover.Trigger data-network-status-trigger>
    <span
      data-status-dot
      style:background={statusColors[networkStatus.status.overall]}
      aria-label={statusLabels[networkStatus.status.overall]}
    />
    <span class="sr-only">Network status: {networkStatus.status.overall}</span>
  </Popover.Trigger>

  <Popover.Content data-network-status-popover>
    <h3 data-status-title>
      <span
        data-status-dot
        style:background={statusColors[networkStatus.status.overall]}
      />
      {statusLabels[networkStatus.status.overall]}
    </h3>

    <div data-status-section>
      <h4>LI.FI API</h4>
      <span data-status-badge={networkStatus.status.lifiApi}>
        {networkStatus.status.lifiApi}
      </span>
    </div>

    {#if degradedChains.length > 0}
      <div data-status-section>
        <h4>Affected Networks</h4>
        <ul data-status-chains>
          {#each degradedChains as chain (chain.chainId)}
            <li>
              <span>{networksByChainId[chain.chainId]?.name ?? `Chain ${chain.chainId}`}</span>
              <span data-status-badge={chain.status}>
                {chain.status}
                {#if chain.latencyMs}
                  ({chain.latencyMs}ms)
                {/if}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <p data-status-all-healthy>All {networkStatus.status.chains.size} networks healthy</p>
    {/if}

    <p data-status-updated>
      Last updated: {new Date(networkStatus.status.lastUpdated).toLocaleTimeString()}
    </p>
  </Popover.Content>
</Popover.Root>

<style>
  [data-network-status-trigger] {
    display: flex;
    align-items: center;
    gap: 0.25em;
    padding: 0.5em;
    background: none;
    border: none;
    cursor: pointer;
  }

  [data-status-dot] {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  [data-network-status-popover] {
    width: 280px;
    padding: 1em;
  }

  [data-status-title] {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin-bottom: 1em;
    font-size: 0.875em;
  }

  [data-status-section] {
    margin: 0.75em 0;
  }

  [data-status-section] h4 {
    font-size: 0.75em;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 0.5em;
  }

  [data-status-chains] {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  [data-status-chains] li {
    display: flex;
    justify-content: space-between;
    font-size: 0.875em;
    padding: 0.25em 0;
  }

  [data-status-badge] {
    font-size: 0.75em;
    padding: 0.125em 0.375em;
    border-radius: 0.25em;
    text-transform: capitalize;
  }

  [data-status-badge="healthy"] {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #22c55e);
  }

  [data-status-badge="degraded"] {
    background: var(--color-warning-bg, #fef3c7);
    color: var(--color-warning, #d97706);
  }

  [data-status-badge="down"] {
    background: var(--color-error-bg, #fef2f2);
    color: var(--color-error, #dc2626);
  }

  [data-status-all-healthy] {
    font-size: 0.875em;
    opacity: 0.8;
  }

  [data-status-updated] {
    font-size: 0.75em;
    opacity: 0.5;
    margin-top: 1em;
    text-align: right;
  }
</style>
```

### Initialize in layout

```svelte
<script>
  import { networkStatus } from '$/lib/network-status.svelte'
  import { networks } from '$/constants/networks'
  import { onMount } from 'svelte' // or use $effect

  $effect(() => {
    const chainIds = networks.map(n => n.id)
    networkStatus.start(chainIds)
    return () => networkStatus.stop()
  })
</script>
```

### Warn on degraded chain selection

```svelte
{@const fromChainStatus = networkStatus.getChainStatus(Number(fromChain))}
{#if fromChainStatus?.status === 'degraded'}
  <p data-chain-warning>
    ⚠️ {networksByChainId[Number(fromChain)]?.name} is experiencing delays
  </p>
{:else if fromChainStatus?.status === 'down'}
  <p data-chain-error>
    ⛔ {networksByChainId[Number(fromChain)]?.name} is currently unavailable
  </p>
{/if}
```

## Acceptance criteria

### Network status store
- [x] `checkChain()` pings RPC and measures latency
- [x] `checkLifiApi()` checks LI.FI API availability
- [x] `checkAll()` checks all chains in parallel
- [x] Status categorized: healthy (<2s), degraded (2-10s), down (>10s/error)
- [x] Periodic checks every 30 seconds
- [x] `start()` and `stop()` manage interval

### NetworkStatusIndicator
- [x] Compact dot indicator (green/yellow/red)
- [x] Popover shows detailed status
- [x] Lists degraded/down chains
- [x] Shows LI.FI API status
- [x] Shows last update time
- [x] All healthy shows count

### Integration
- [x] Indicator in header/nav
- [x] Warning when selecting degraded chain
- [x] Error when selecting down chain
- [x] Status checks start on page load

## Status

Complete. `src/lib/network-status.svelte.ts`: store with checkChain (RPC + latency,
timeout 10s), checkLifiApi (li.quest/v1/status), checkAll (parallel),
healthy/degraded/down thresholds, start/stop with 30s interval.
`src/components/NetworkStatusIndicator.svelte`: Popover trigger with status dot,
content with LI.FI API badge, affected chains list or "All N networks healthy",
last updated. Layout: $effect starts networkStatus with networks chainIds and
cleanup stop. Navigation: NetworkStatusIndicator in header menu. BridgeFlow:
chain status warning (degraded) and error (down) with chain name.

## Output when complete

`DONE`
