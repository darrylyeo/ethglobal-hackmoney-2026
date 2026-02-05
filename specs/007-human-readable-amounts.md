# Spec 007: Human-readable amount input

The bridge UI currently requires entering amounts in smallest units (e.g., `1000000`
for 1 USDC). This spec adds human-readable decimal input with automatic conversion.

## Requirements

1. **Amount input component** with:
   - Decimal input (e.g., `100.50` for 100.50 USDC)
   - Automatic conversion to smallest units for API calls
   - Max button to use full balance
   - Input validation (numbers only, single decimal point)

2. **Balance-aware input:**
   - Show available balance next to input
   - Validate amount doesn't exceed balance
   - Show warning if insufficient funds
   - Disable "Get Quote" if invalid

3. **Input UX:**
   - Allow paste of numbers with commas (strip formatting)
   - Prevent entering more decimals than token supports
   - Show equivalent USD value if available

## Implementation

### `src/lib/format.ts` additions

Extend existing `formatTokenAmount`:

```typescript
export const parseDecimalToSmallest = (
  value: string,
  decimals: number,
): bigint => {
  // Strip commas and whitespace
  const cleaned = value.replace(/[,\s]/g, '')
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '') return 0n
  const [integer = '0', fraction = ''] = cleaned.split('.')
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
  return BigInt((integer || '0') + paddedFraction)
}

export const formatSmallestToDecimal = (
  value: bigint | string,
  decimals: number,
  maxFractionDigits?: number,
): string => {
  const str = typeof value === 'string' ? value : value.toString()
  if (str === '0') return '0'
  const padded = str.padStart(decimals + 1, '0')
  const intPart = padded.slice(0, -decimals) || '0'
  let fracPart = padded.slice(-decimals).replace(/0+$/, '')
  if (maxFractionDigits !== undefined && fracPart.length > maxFractionDigits) {
    fracPart = fracPart.slice(0, maxFractionDigits)
  }
  return fracPart === '' ? intPart : `${intPart}.${fracPart}`
}

export const isValidDecimalInput = (value: string, decimals: number): boolean => {
  const cleaned = value.replace(/[,\s]/g, '')
  if (!/^\d*\.?\d*$/.test(cleaned)) return false
  const [, fraction = ''] = cleaned.split('.')
  return fraction.length <= decimals
}
```

### `src/routes/bridge/lifi/BridgeFlow.svelte` – Amount input section

Amount input is implemented inline in `BridgeFlow.svelte` rather than a separate
component. It uses:

- `parseDecimalToSmallest` and `formatSmallestToDecimal` from `$/lib/format`
- `isValidDecimalInput` for validation
- `bridgeSettingsState` for persisted amount state (as `bigint`)
- Balance from `actorCoinsCollection` query for Max button and validation

```svelte
<!-- Amount -->
<div data-column="gap-1">
  <label for="amt">Amount</label>
  <div data-row="gap-2">
    <input id="amt" type="text" inputmode="decimal" placeholder="0.00"
      value={settings.amount === 0n ? '' : formatSmallestToDecimal(settings.amount, 6)}
      oninput={onAmountInput} style="flex:1" />
    {#if sourceBalance !== null}
      <Button.Root type="button" onclick={() => { bridgeSettingsState.current = { ...settings, amount: sourceBalance } }}>Max</Button.Root>
    {/if}
  </div>
  {#if sourceBalance !== null}<small data-muted>Balance: {formatSmallestToDecimal(sourceBalance, 6, 4)} USDC</small>{/if}
  {#if exceedsBalance}<small data-error>Insufficient balance</small>
  {:else if validation.error === 'too_low'}<small data-error>Min {validation.minAmount} USDC</small>
  {:else if validation.error === 'too_high'}<small data-error>Max {validation.maxAmount} USDC</small>{/if}
</div>
```

Amount is stored as `bigint` in `bridgeSettingsState` and displayed/parsed via
format helpers.

### Unit tests (`src/lib/format.spec.ts`)

```typescript
Deno.test('parseDecimalToSmallest handles whole numbers', () => {
  assertEquals(parseDecimalToSmallest('100', 6), 100000000n)
})

Deno.test('parseDecimalToSmallest handles decimals', () => {
  assertEquals(parseDecimalToSmallest('100.5', 6), 100500000n)
  assertEquals(parseDecimalToSmallest('0.000001', 6), 1n)
})

Deno.test('parseDecimalToSmallest handles commas', () => {
  assertEquals(parseDecimalToSmallest('1,000.50', 6), 1000500000n)
})

Deno.test('parseDecimalToSmallest truncates extra decimals', () => {
  assertEquals(parseDecimalToSmallest('1.1234567', 6), 1123456n)
})

Deno.test('formatSmallestToDecimal formats correctly', () => {
  assertEquals(formatSmallestToDecimal(100500000n, 6), '100.5')
  assertEquals(formatSmallestToDecimal(1n, 6), '0.000001')
  assertEquals(formatSmallestToDecimal(0n, 6), '0')
})

Deno.test('isValidDecimalInput validates correctly', () => {
  assertEquals(isValidDecimalInput('100.50', 6), true)
  assertEquals(isValidDecimalInput('100.1234567', 6), false) // 7 decimals
  assertEquals(isValidDecimalInput('abc', 6), false)
})
```

## Acceptance criteria

### Format functions
- [x] `parseDecimalToSmallest('100.5', 6)` returns `100500000n`
- [x] `parseDecimalToSmallest('1,000.50', 6)` returns `1000500000n`
- [x] `parseDecimalToSmallest('', 6)` returns `0n`
- [x] `formatSmallestToDecimal(100500000n, 6)` returns `'100.5'`
- [x] `formatSmallestToDecimal(1n, 6)` returns `'0.000001'`
- [x] `isValidDecimalInput('100.1234567', 6)` returns `false`

### Amount input (inline in BridgeFlow)
- [x] Accepts decimal values (e.g., `50.25`)
- [x] Shows balance when provided
- [x] "Max" button fills input with formatted balance
- [x] Insufficient balance shows error message
- [x] Invalid input (letters, too many decimals) shows error
- [x] Strips commas on paste

### Integration
- [x] BridgeFlow uses inline amount input with format helpers
- [x] Quote API receives correct smallest-unit value via `bridgeSettingsState`
- [x] Submit disabled when amount invalid or exceeds balance

## Status

Complete. format.ts helpers (`parseDecimalToSmallest`, `formatSmallestToDecimal`,
`isValidDecimalInput`), amount input inline in BridgeFlow.svelte, format.spec.ts.
Re-verification 2026-02-04 (PROMPT_build): format.ts and format.spec.ts verified;
UnifiedBridgeFlow uses CoinAmountInput with format helpers; validation and submit gating; test:unit passed.
Re-verification 2026-02-05 (PROMPT_build execute one spec): all AC re-verified (format.ts + format.spec.ts; CoinAmountInput in UnifiedBridgeFlow; BridgeFlow uses settings.amount, sourceBalance, exceedsBalance, canSendAmount); test:unit 41 Deno + 101 Vitest passed. Re-verification 2026-02-05 (PROMPT_build execute one spec): no incomplete specs; re-verified spec 007; all 15 AC confirmed (format.ts helpers, format.spec.ts, CoinAmountInput/UnifiedBridgeFlow amount input, balance, Max, validation, submit gating); test:unit 41 Deno + 101 Vitest passed.

## Output when complete

`DONE`
