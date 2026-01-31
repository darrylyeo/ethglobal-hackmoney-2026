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

### Balance grid skeleton

```svelte
<!-- In bridge page, when loading balances -->
{#if actorCoins.length === 0}
  <div data-balances-grid>
    {#each Array(6) as _, i (i)}
      <div data-balance-item data-loading>
        <Skeleton width="60%" height="0.75em" />
        <Skeleton width="80%" height="1.25em" />
      </div>
    {/each}
  </div>
{:else}
  <!-- Actual balances -->
{/if}
```

### Route list skeleton

```svelte
<!-- In RouteList, when loading -->
{#if loading}
  <div data-route-list>
    {#each Array(3) as _, i (i)}
      <div data-route-card-skeleton>
        <div data-route-header>
          <Skeleton width="120px" height="1.25em" />
          <Skeleton width="60px" height="1.5em" rounded="0.25em" />
        </div>
        <div data-route-details>
          <Skeleton width="100px" height="1em" />
          <Skeleton width="60px" height="1em" />
          <Skeleton width="80px" height="1em" />
        </div>
      </div>
    {/each}
  </div>
{/if}
```

### Button states in bridge page

```svelte
<LoadingButton
  type="submit"
  loading={routesLoading}
  loadingText="Finding routes…"
>
  Get Routes
</LoadingButton>

<LoadingButton
  type="button"
  onclick={bridge}
  loading={execLoading}
  loadingText="Bridging…"
  disabled={!selectedRoute || quoteExpired}
>
  Bridge
</LoadingButton>
```

### Optimistic loading

For balance fetches, show stale data with loading indicator:

```svelte
{#each actorCoins as ac (ac.key)}
  <div data-balance-item data-loading={ac.isLoading ? '' : undefined}>
    <span>{networkName}</span>
    <span data-balance-value>
      {#if ac.isLoading && ac.balance === 0n}
        <Skeleton width="80px" height="1em" />
      {:else}
        {ac.balanceFormatted}
        {#if ac.isLoading}
          <Spinner size="0.75em" />
        {/if}
      {/if}
    </span>
  </div>
{/each}
```

## Acceptance criteria

### Skeleton component
- [ ] `Skeleton.svelte` renders animated placeholder
- [ ] Width, height, and border-radius configurable
- [ ] Shimmer animation runs smoothly

### Spinner component
- [ ] `Spinner.svelte` renders spinning indicator
- [ ] Size configurable
- [ ] Uses currentColor for theming

### LoadingButton component
- [ ] Shows spinner + text when loading
- [ ] Disabled when loading
- [ ] Falls back to children when not loading

### Balance loading
- [ ] Skeleton grid shown before any balances load
- [ ] Individual balances show spinner while refreshing
- [ ] Stale balance shown during refresh (optimistic)

### Route loading
- [ ] Skeleton route cards shown while fetching
- [ ] 3 skeleton cards by default
- [ ] "Finding routes…" button state

### Form interactions
- [ ] All form inputs disabled during submission
- [ ] Submit button shows loading state
- [ ] Double-submit prevented

## Status

Not started.

## Output when complete

`DONE`
