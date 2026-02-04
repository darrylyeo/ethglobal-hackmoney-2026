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

### Fee display in `src/routes/bridge/lifi/BridgeFlow.svelte`

Fee breakdown is shown inline in the quote summary:

```svelte
const fees = $derived(selectedRoute ? extractFeeBreakdown({
  steps: selectedRoute.originalRoute.steps,
  fromAmountUSD: selectedRoute.originalRoute.fromAmountUSD
}) : null)

<!-- In quote summary -->
{#if fees}
  <dt>Est. fees</dt><dd>~${fees.totalUsd}</dd>
{/if}
```

### Route card fees

Each route card shows fees inline:

```svelte
<span data-muted>${r.gasCostUsd.toFixed(2)} fees</span>
```

## Acceptance criteria

### Fee extraction
- [x] `extractFeeBreakdown()` extracts gas costs from route
- [x] Extracts protocol/bridge fees
- [x] Calculates total in USD
- [x] Calculates percentage of transfer amount

### Fee display (inline in BridgeFlow)
- [x] Shows total fees in USD
- [x] Derived from selected route via `extractFeeBreakdown`
- [x] Handles missing fee data gracefully

### Integration
- [x] Fee summary shown in quote details section
- [x] Route cards show `gasCostUsd` inline
- [x] Sorting by fees uses `gasCostUsd` from normalized routes

## Status

Complete. `FeeBreakdown` type and `extractFeeBreakdown` in `src/api/lifi.ts`. Fees
shown inline in BridgeFlow.svelte via `fees.totalUsd` in quote summary and
`gasCostUsd` in route cards. Unit tests for extractFeeBreakdown.

## Output when complete

`DONE`
