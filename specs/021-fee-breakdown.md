# Spec 021: Detailed fee breakdown

Show users a clear breakdown of all fees involved in the bridge transaction.

## Requirements

1. **Fee categories:**
   - Gas fees (source chain)
   - Bridge/protocol fees
   - Relayer fees (if any)
   - Destination gas (if prepaid)

2. **Display format:**
   - Individual fee line items
   - Total fees in USD
   - Percentage of transfer amount

3. **Comparison across routes:**
   - Show fees prominently in route cards
   - Allow sorting by total fees

## Implementation

### Fee types

```typescript
// src/api/lifi.ts
export type FeeBreakdown = {
  gasCost: {
    amount: string
    amountUsd: string
    token: { symbol: string; decimals: number }
    chainId: number
  }[]
  protocolFees: {
    name: string
    amount: string
    amountUsd: string
    token: { symbol: string; decimals: number }
  }[]
  totalUsd: string
  percentOfTransfer: number
}

export const extractFeeBreakdown = (route: Route): FeeBreakdown => {
  const gasCost: FeeBreakdown['gasCost'] = []
  const protocolFees: FeeBreakdown['protocolFees'] = []
  let totalUsd = 0

  for (const step of route.steps) {
    // Gas costs
    if (step.estimate?.gasCosts) {
      for (const gas of step.estimate.gasCosts) {
        gasCost.push({
          amount: gas.amount ?? '0',
          amountUsd: gas.amountUSD ?? '0',
          token: {
            symbol: gas.token?.symbol ?? 'ETH',
            decimals: gas.token?.decimals ?? 18,
          },
          chainId: step.action.fromChainId,
        })
        totalUsd += parseFloat(gas.amountUSD ?? '0')
      }
    }

    // Protocol/bridge fees
    if (step.estimate?.feeCosts) {
      for (const fee of step.estimate.feeCosts) {
        protocolFees.push({
          name: fee.name ?? step.toolDetails?.name ?? 'Bridge fee',
          amount: fee.amount ?? '0',
          amountUsd: fee.amountUSD ?? '0',
          token: {
            symbol: fee.token?.symbol ?? 'USDC',
            decimals: fee.token?.decimals ?? 6,
          },
        })
        totalUsd += parseFloat(fee.amountUSD ?? '0')
      }
    }
  }

  const fromAmountUsd = parseFloat(route.fromAmountUSD ?? route.fromAmount)
  const percentOfTransfer = fromAmountUsd > 0
    ? (totalUsd / fromAmountUsd) * 100
    : 0

  return {
    gasCost,
    protocolFees,
    totalUsd: totalUsd.toFixed(2),
    percentOfTransfer: Math.round(percentOfTransfer * 100) / 100,
  }
}
```

### `src/routes/bridge/FeeBreakdown.svelte`

```svelte
<script lang="ts">
  import type { FeeBreakdown } from '$/api/lifi'
  import { formatTokenAmount } from '$/lib/format'
  import { networksByChainId } from '$/constants/networks'

  let {
    fees,
    expanded = false,
  }: {
    fees: FeeBreakdown
    expanded?: boolean
  } = $props()

  let isExpanded = $state(expanded)
</script>

<div data-fee-breakdown>
  <button
    type="button"
    data-fee-summary
    onclick={() => { isExpanded = !isExpanded }}
    aria-expanded={isExpanded}
  >
    <span>Total fees: ~${fees.totalUsd}</span>
    <span data-fee-percent>({fees.percentOfTransfer}% of transfer)</span>
    <span data-fee-toggle>{isExpanded ? '▲' : '▼'}</span>
  </button>

  {#if isExpanded}
    <div data-fee-details>
      {#if fees.gasCost.length > 0}
        <div data-fee-section>
          <h4>Gas fees</h4>
          {#each fees.gasCost as gas (gas.chainId + gas.token.symbol)}
            <div data-fee-line>
              <span>{networksByChainId[gas.chainId]?.name ?? 'Unknown'} gas</span>
              <span>
                {formatTokenAmount(gas.amount, gas.token.decimals)} {gas.token.symbol}
                <span data-fee-usd>(~${gas.amountUsd})</span>
              </span>
            </div>
          {/each}
        </div>
      {/if}

      {#if fees.protocolFees.length > 0}
        <div data-fee-section>
          <h4>Protocol fees</h4>
          {#each fees.protocolFees as fee (fee.name + fee.token.symbol)}
            <div data-fee-line>
              <span>{fee.name}</span>
              <span>
                {formatTokenAmount(fee.amount, fee.token.decimals)} {fee.token.symbol}
                <span data-fee-usd>(~${fee.amountUsd})</span>
              </span>
            </div>
          {/each}
        </div>
      {/if}

      {#if fees.gasCost.length === 0 && fees.protocolFees.length === 0}
        <p data-fee-none>No fee details available</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  [data-fee-breakdown] {
    border: 1px solid var(--color-border);
    border-radius: 0.5em;
    overflow: hidden;
  }

  [data-fee-summary] {
    display: flex;
    align-items: center;
    gap: 0.5em;
    width: 100%;
    padding: 0.75em;
    background: var(--color-bg-subtle);
    border: none;
    cursor: pointer;
    text-align: left;
  }

  [data-fee-percent] {
    opacity: 0.7;
    font-size: 0.875em;
  }

  [data-fee-toggle] {
    margin-left: auto;
    font-size: 0.75em;
  }

  [data-fee-details] {
    padding: 0.75em;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  [data-fee-section] h4 {
    font-size: 0.75em;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 0.5em;
  }

  [data-fee-line] {
    display: flex;
    justify-content: space-between;
    font-size: 0.875em;
  }

  [data-fee-usd] {
    opacity: 0.7;
    font-size: 0.875em;
  }
</style>
```

### Route card integration

Add fee summary to `RouteCard.svelte`:

```svelte
{@const fees = extractFeeBreakdown(route.originalRoute)}
<span data-route-fees>~${fees.totalUsd} fees</span>
```

### Quote output integration

Show full breakdown after route selected:

```svelte
{#if selectedRoute}
  {@const fees = extractFeeBreakdown(selectedRoute.originalRoute)}
  <FeeBreakdown {fees} expanded={true} />
{/if}
```

## Acceptance criteria

### Fee extraction
- [x] `extractFeeBreakdown()` extracts gas costs from route
- [x] Extracts protocol/bridge fees
- [x] Calculates total in USD
- [x] Calculates percentage of transfer amount

### FeeBreakdown component
- [x] Shows total fees and percentage
- [x] Expandable to show details
- [x] Gas fees section with chain names
- [x] Protocol fees section with fee names
- [x] Individual amounts and USD equivalents
- [x] Handles missing fee data gracefully

### Integration
- [x] Fee summary shown in quote output (single-route flow; no route cards)
- [x] Full breakdown shown for selected route (QuoteOutput with quoteStep)
- [ ] Sorting by fees uses extracted total (N/A: single quote, no route comparison)

## Status

Complete. FeeBreakdown type and extractFeeBreakdown in lifi.ts; FeeBreakdown.svelte; QuoteOutput shows fee summary and expandable breakdown when quoteStep is available. Unit tests for extractFeeBreakdown. Route cards / sorting N/A for current single-quote UI.

## Output when complete

`DONE`
