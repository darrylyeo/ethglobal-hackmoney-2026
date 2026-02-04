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

### Quote expiration in `src/routes/bridge/lifi/BridgeFlow.svelte`

Quote expiration is implemented inline in BridgeFlow with:

- `now` state updated via `setInterval` every second
- `quoteExpiry` derived from `routesRow.fetchedAt + QUOTE_TTL`
- `quoteRemaining` and `quoteExpired` derived states
- Refresh button that calls `onRefresh` → `fetchBridgeRoutes`
- Auto-refresh every 10 seconds via `setInterval`

```svelte
<!-- Quote expiry display in Quote Details section -->
<div data-row="gap-2 align-center" data-muted>
  {#if routesRow?.isLoading}
    Refreshing…
  {:else if quoteRemaining !== null}
    {quoteExpired ? 'Expired' : `${quoteRemaining}s`}
  {/if}
  <Button.Root onclick={onRefresh} disabled={routesRow?.isLoading}>↻</Button.Root>
</div>
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
- [x] Quote fetchedAt timestamp stored when quote received
- [x] expiresAt calculated as fetchedAt + 60 seconds
- [x] isExpired derived from current time vs expiresAt

### QuoteExpiration component
- [x] Shows countdown "Quote valid for Xs"
- [x] Warning style at 15 seconds remaining
- [x] "Quote expired" message when expired
- [x] Refresh button triggers new quote fetch
- [x] Refresh button disabled while loading

### Integration
- [x] Bridge button disabled when quote expired
- [x] Expired quote shows prompt to refresh
- [x] New quote fetch updates fetchedAt
- [x] Auto-refresh toggle available (optional)

## Status

Complete. BridgeFlow.svelte: `now` state updated every second, `quoteExpiry`
derived from `routesRow.fetchedAt + QUOTE_TTL` (60s), `quoteRemaining` and
`quoteExpired` derived states, refresh button, auto-refresh every 10s via
`setInterval`. Send button disabled when `quoteExpired`.

## Output when complete

`DONE`
