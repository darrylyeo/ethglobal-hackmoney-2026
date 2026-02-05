# Spec 020: Bridge limits and validation

Display and enforce minimum/maximum bridge amounts based on LI.FI route constraints.

## Requirements

1. **Extract limits from routes:**
   - LI.FI routes include `minAmount` and `maxAmount` per step
   - Display these limits to users
   - Validate amount against limits

2. **Pre-validation:**
   - Before fetching routes, check if amount is reasonable
   - Show guidance on typical min/max ranges

3. **Error handling:**
   - "Amount too low" with minimum shown
   - "Amount too high" with maximum shown
   - "No routes available" for amounts outside all limits

## Implementation

### `src/constants/bridge-limits.ts`

```typescript
// USDC has 6 decimals, so these are in smallest units
export const USDC_MIN_AMOUNT = 1_000_000n // 1 USDC
export const USDC_MAX_AMOUNT = 1_000_000_000_000n // 1M USDC

export type AmountValidation = {
  isValid: boolean
  error?: 'too_low' | 'too_high' | 'invalid'
  minAmount?: string
  maxAmount?: string
}

export type RouteLimits = {
  minAmount: bigint | null
  maxAmount: bigint | null
}

export const validateBridgeAmount = (
  amount: bigint,
  minAmount: bigint = USDC_MIN_AMOUNT,
  maxAmount: bigint = USDC_MAX_AMOUNT,
): AmountValidation

export const extractRouteLimits = (routes: ...): RouteLimits
```

### Amount validation UI in `BridgeFlow.svelte`

```svelte
{@const amountBigint = parseDecimalToSmallest(amount, 6)}
{@const validation = validateBridgeAmount(amountBigint)}

{#if !validation.isValid}
  <p data-amount-validation-error role="alert">
    {#if validation.error === 'too_low'}
      Minimum amount is {validation.minAmount} USDC
    {:else if validation.error === 'too_high'}
      Maximum amount is {validation.maxAmount} USDC
    {:else}
      Enter a valid amount
    {/if}
  </p>
{/if}

<Button.Root
  type="submit"
  disabled={!validation.isValid || quoteLoading || ...}
>
  Get Routes
</Button.Root>
```

### Route-specific limit display

After fetching routes, show actual limits:

```svelte
{#if routes.length > 0}
  {@const limits = extractRouteLimits(routes)}
  {#if limits.minAmount || limits.maxAmount}
    <p data-route-limits>
      {#if limits.minAmount}
        Min: {formatSmallestToDecimal(limits.minAmount, 6)} USDC
      {/if}
      {#if limits.maxAmount}
        Max: {formatSmallestToDecimal(limits.maxAmount, 6)} USDC
      {/if}
    </p>
  {/if}
{/if}
```

### Handle "no routes" for amount issues

When routes return empty, provide guidance:

```svelte
{:else if routes.length === 0 && !routesLoading}
  <div data-no-routes>
    <p>No routes available for this transfer.</p>
    <ul>
      <li>Try a different amount (min ~1 USDC, max varies by route)</li>
      <li>Try a different chain pair</li>
      <li>Check if the bridge is operational</li>
    </ul>
  </div>
{/if}
```

## Acceptance criteria

### Validation functions
- [x] `validateBridgeAmount()` returns valid for amounts in range
- [x] Returns `too_low` error with min amount for small amounts
- [x] Returns `too_high` error with max amount for large amounts
- [x] Zero and negative amounts invalid

### Pre-fetch validation
- [x] Amount validated before "Get Routes" enabled
- [x] Error messages show min/max values
- [x] Form submission blocked for invalid amounts

### Route limits display
- [x] Limits extracted from routes when available
- [x] Min/max shown after routes fetched
- [x] "No routes" message includes guidance

### Edge cases
- [x] Very small amounts (< 1 USDC) show minimum error
- [x] Very large amounts show maximum error
- [x] Empty amount shows "Enter a valid amount"

## Status

Complete. `src/constants/bridge-limits.ts` with USDC_MIN_AMOUNT, USDC_MAX_AMOUNT,
AmountValidation type, validateBridgeAmount, extractRouteLimits. BridgeFlow.svelte
uses validation inline with `canSendAmount` derived state. Re-verification 2026-02-04: all acceptance criteria verified; bridge-limits.spec.ts (6 tests) pass; BridgeFlow/UnifiedBridgeFlow use validation and route limits; build passes. Re-verification 2026-02-05 (PROMPT_build execute one spec): all 12 AC re-verified (validation functions, pre-fetch validation, route limits display, edge cases); bridge-limits.spec.ts 6 tests + test:unit 41 Deno + 101 Vitest passed.

## Output when complete

`DONE`
