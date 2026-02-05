# Spec 017: Loading states and skeleton UI

Consistent loading indicators throughout the bridge UI for better perceived
performance and user feedback.

## Requirements

1. **Loading indicators:**
   - Button loading states (spinner + "Loading…" text)
   - Section loading states (skeleton or spinner)
   - Inline loading (e.g., balance fetching)

2. **Skeleton patterns:**
   - Balance grid skeletons
   - Route card skeletons
   - Quote result skeleton

3. **Disable interactions during loading:**
   - Buttons disabled with loading indicator
   - Form inputs disabled during submission
   - Prevent double-submit

## Implementation

### `src/components/Skeleton.svelte`

```svelte
<script lang="ts">
  let {
    width = '100%',
    height = '1em',
    rounded = '0.25em',
  }: {
    width?: string
    height?: string
    rounded?: string
  } = $props()
</script>

<span
  data-skeleton
  style:width={width}
  style:height={height}
  style:border-radius={rounded}
></span>

<style>
  [data-skeleton] {
    display: inline-block;
    background: linear-gradient(
      90deg,
      var(--color-skeleton, #e5e7eb) 25%,
      var(--color-skeleton-highlight, #f3f4f6) 50%,
      var(--color-skeleton, #e5e7eb) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
```

### `src/components/Spinner.svelte`

```svelte
<script lang="ts">
  let {
    size = '1em',
  }: {
    size?: string
  } = $props()
</script>

<span data-spinner style:width={size} style:height={size} aria-hidden="true"></span>

<style>
  [data-spinner] {
    display: inline-block;
    border: 2px solid var(--color-spinner-track, #e5e7eb);
    border-top-color: var(--color-spinner, currentColor);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

### `src/components/LoadingButton.svelte`

```svelte
<script lang="ts">
  import { Button } from 'bits-ui'
  import Spinner from './Spinner.svelte'

  let {
    loading = false,
    loadingText,
    children,
    ...props
  }: {
    loading?: boolean
    loadingText?: string
    children: import('svelte').Snippet
    [key: string]: unknown
  } = $props()
</script>

<Button.Root {...props} disabled={loading || props.disabled}>
  {#if loading}
    <Spinner size="1em" />
    <span>{loadingText ?? 'Loading…'}</span>
  {:else}
    {@render children()}
  {/if}
</Button.Root>

<style>
  :global([data-loading-button]) {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
  }
</style>
```

### Loading states in BridgeFlow.svelte

Loading states are shown inline:

```svelte
<!-- Routes loading -->
<h3>Routes {routesRow?.isLoading ? '(loading…)' : `(${sortedRoutes.length})`}</h3>

<!-- Quote refresh -->
{#if routesRow?.isLoading}
  Refreshing…
{:else if quoteRemaining !== null}
  {quoteExpired ? 'Expired' : `${quoteRemaining}s`}
{/if}

<!-- Send button -->
<Button.Root disabled={quoteExpired || executing || needsChainSwitch || !canSendAmount}>
  {executing ? 'Bridging…' : 'Send'}
</Button.Root>
```

### CoinBalances.svelte

CoinBalances component shows loading state per-chain via `isLoading` from
`actorCoinsCollection`.

## Acceptance criteria

### Skeleton component
- [x] `Skeleton.svelte` renders animated placeholder
- [x] Width, height, and border-radius configurable
- [x] Shimmer animation runs smoothly

### Spinner component
- [x] `Spinner.svelte` renders spinning indicator
- [x] Size configurable
- [x] Uses currentColor for theming

### LoadingButton component
- [x] Shows spinner + text when loading
- [x] Disabled when loading
- [x] Falls back to children when not loading

### Balance loading
- [x] Skeleton grid shown before any balances load
- [x] Individual balances show skeleton while refreshing

### Route loading
- [x] Skeleton route cards shown while fetching
- [x] 3 skeleton cards by default
- [x] "Finding routes…" button state

### Form interactions
- [x] All form inputs disabled during submission
- [x] Submit button shows loading state
- [x] Double-submit prevented

## Status

Complete. `src/components/Skeleton.svelte`, `src/components/Spinner.svelte`,
`src/components/LoadingButton.svelte`. BridgeFlow.svelte: routes loading shows
"(loading…)" in header, "Finding routes…" + 3 skeleton route cards while fetching,
quote refresh shows "Refreshing…", Send button shows "Bridging…" when executing,
button disabled during loading states. CoinBalances.svelte: skeleton grid (6 items)
when balancesQuery.isLoading and no balances; per-balance skeleton while refreshing.
Re-verification 2026-02-05 (PROMPT_build execute one spec): all
AC re-verified; skeleton route cards and balance skeleton grid added; test:unit
41 Deno + 101 Vitest passed. Re-verification 2026-02-05 (PROMPT_build.md execute
one spec, re-verify): all 18 AC confirmed (Skeleton/Spinner/LoadingButton,
BridgeFlow routes header "(loading…)", Finding routes…, 3 skeleton cards,
Refreshing…, Bridging…, Balances 6-item skeleton grid, per-balance skeleton,
form disabled/double-submit); test:unit 41 Deno + 101 Vitest passed.

## Output when complete

`DONE`
