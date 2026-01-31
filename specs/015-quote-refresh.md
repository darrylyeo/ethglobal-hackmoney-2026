# Spec 015: Quote refresh and expiration

Bridge quotes have limited validity. This spec adds automatic refresh and expiration
warnings to prevent failed transactions from stale quotes.

## Requirements

1. **Quote expiration tracking:**
   - LI.FI quotes typically valid for ~60 seconds
   - Track quote timestamp
   - Show countdown to expiration
   - Auto-clear expired quotes

2. **Auto-refresh:**
   - Optionally auto-refresh quote before expiration
   - User can enable/disable auto-refresh
   - Show "refreshing..." indicator

3. **Manual refresh:**
   - "Refresh Quote" button always available
   - Disabled while loading

4. **Expiration warning:**
   - Warning at 15 seconds remaining
   - Expired quotes show "Quote expired – refresh to continue"
   - Disable "Bridge" button when expired

## Implementation

### Quote state extension

```typescript
type QuoteState = {
  quote: NormalizedQuote | null
  fetchedAt: number | null
  expiresAt: number | null
  isExpired: boolean
  isRefreshing: boolean
}

const QUOTE_VALIDITY_MS = 60_000 // 60 seconds
const EXPIRATION_WARNING_MS = 15_000 // warn at 15 seconds remaining
```

### `src/routes/bridge/QuoteExpiration.svelte`

```svelte
<script lang="ts">
  let {
    expiresAt,
    onRefresh,
    isRefreshing = false,
  }: {
    expiresAt: number | null
    onRefresh: () => void
    isRefreshing?: boolean
  } = $props()

  let now = $state(Date.now())

  $effect(() => {
    const interval = setInterval(() => { now = Date.now() }, 1000)
    return () => clearInterval(interval)
  })

  const remainingMs = $derived(expiresAt ? expiresAt - now : null)
  const remainingSec = $derived(
    remainingMs !== null ? Math.max(0, Math.ceil(remainingMs / 1000)) : null
  )
  const isExpired = $derived(remainingMs !== null && remainingMs <= 0)
  const isWarning = $derived(
    remainingMs !== null && remainingMs > 0 && remainingMs <= 15_000
  )
</script>

{#if expiresAt !== null}
  <div
    data-quote-expiration
    data-expired={isExpired ? '' : undefined}
    data-warning={isWarning ? '' : undefined}
  >
    {#if isExpired}
      <span>Quote expired</span>
    {:else}
      <span>Quote valid for {remainingSec}s</span>
    {/if}
    <button
      type="button"
      onclick={onRefresh}
      disabled={isRefreshing}
    >
      {isRefreshing ? 'Refreshing…' : 'Refresh'}
    </button>
  </div>
{/if}

<style>
  [data-quote-expiration] {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-size: 0.875em;
  }

  [data-quote-expiration][data-warning] {
    color: var(--color-warning, #f59e0b);
  }

  [data-quote-expiration][data-expired] {
    color: var(--color-error, #ef4444);
  }
</style>
```

### Bridge page integration

```svelte
let quoteFetchedAt = $state<number | null>(null)
const quoteExpiresAt = $derived(
  quoteFetchedAt ? quoteFetchedAt + QUOTE_VALIDITY_MS : null
)
const quoteIsExpired = $derived(
  quoteExpiresAt !== null && Date.now() > quoteExpiresAt
)

const getQuote = async () => {
  // ... existing quote logic
  quoteFetchedAt = Date.now()
}

// Disable bridge button when expired
const canBridge = $derived(
  quote !== null && !quoteIsExpired && !execLoading
)
```

### Auto-refresh (optional feature)

```typescript
let autoRefreshEnabled = $state(false)

$effect(() => {
  if (!autoRefreshEnabled || !quoteExpiresAt) return

  const refreshAt = quoteExpiresAt - 5_000 // refresh 5s before expiry
  const delay = refreshAt - Date.now()
  if (delay <= 0) return

  const timeout = setTimeout(() => {
    if (autoRefreshEnabled && !quoteLoading) {
      getQuote(wallet)
    }
  }, delay)

  return () => clearTimeout(timeout)
})
```

## Acceptance criteria

### Expiration tracking
- [ ] Quote fetchedAt timestamp stored when quote received
- [ ] expiresAt calculated as fetchedAt + 60 seconds
- [ ] isExpired derived from current time vs expiresAt

### QuoteExpiration component
- [ ] Shows countdown "Quote valid for Xs"
- [ ] Warning style at 15 seconds remaining
- [ ] "Quote expired" message when expired
- [ ] Refresh button triggers new quote fetch
- [ ] Refresh button disabled while loading

### Integration
- [ ] Bridge button disabled when quote expired
- [ ] Expired quote shows prompt to refresh
- [ ] New quote fetch updates fetchedAt
- [ ] Auto-refresh toggle available (optional)

## Status

Not started.

## Output when complete

`DONE`
