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

### `src/routes/bridge/AmountInput.svelte`

```svelte
<script lang="ts">
  import { Button } from 'bits-ui'
  import {
    parseDecimalToSmallest,
    formatSmallestToDecimal,
    isValidDecimalInput,
  } from '$/lib/format'

  let {
    value = $bindable(''),
    decimals = 6,
    balance = null,
    symbol = 'USDC',
    disabled = false,
  }: {
    value?: string
    decimals?: number
    balance?: bigint | null
    symbol?: string
    disabled?: boolean
  } = $props()

  const balanceFormatted = $derived(
    balance !== null ? formatSmallestToDecimal(balance, decimals, 4) : null
  )

  const amountSmallest = $derived(parseDecimalToSmallest(value, decimals))

  const exceedsBalance = $derived(
    balance !== null && amountSmallest > balance
  )

  const isValid = $derived(isValidDecimalInput(value, decimals))

  const handleMax = () => {
    if (balance !== null) {
      value = formatSmallestToDecimal(balance, decimals)
    }
  }

  const handleInput = (e: Event) => {
    const input = e.target as HTMLInputElement
    // Strip invalid chars but allow partial input during typing
    value = input.value.replace(/[^0-9.,]/g, '').replace(/,/g, '')
  }
</script>

<div data-amount-input data-error={exceedsBalance || !isValid ? '' : undefined}>
  <div data-amount-input-row>
    <input
      type="text"
      inputmode="decimal"
      autocomplete="off"
      {disabled}
      {value}
      oninput={handleInput}
      placeholder="0.00"
    />
    <span data-amount-symbol>{symbol}</span>
  </div>
  {#if balanceFormatted !== null}
    <div data-amount-balance>
      <span>Balance: {balanceFormatted} {symbol}</span>
      <Button.Root type="button" onclick={handleMax} {disabled}>Max</Button.Root>
    </div>
  {/if}
  {#if exceedsBalance}
    <p data-amount-error role="alert">Insufficient balance</p>
  {/if}
</div>
```

### `QuoteForm.svelte` updates

- Replace raw amount input with `AmountInput`
- Pass `balance` from actorCoins collection for selected source chain
- Convert decimal to smallest units in form submission:
  ```typescript
  const amountSmallest = parseDecimalToSmallest(amount, 6).toString()
  ```
- Disable submit if `exceedsBalance` or `!isValid`

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
- [ ] `parseDecimalToSmallest('100.5', 6)` returns `100500000n`
- [ ] `parseDecimalToSmallest('1,000.50', 6)` returns `1000500000n`
- [ ] `parseDecimalToSmallest('', 6)` returns `0n`
- [ ] `formatSmallestToDecimal(100500000n, 6)` returns `'100.5'`
- [ ] `formatSmallestToDecimal(1n, 6)` returns `'0.000001'`
- [ ] `isValidDecimalInput('100.1234567', 6)` returns `false`

### AmountInput component
- [ ] Accepts decimal values (e.g., `50.25`)
- [ ] Shows balance when provided
- [ ] "Max" button fills input with formatted balance
- [ ] Insufficient balance shows error message
- [ ] Invalid input (letters, too many decimals) shows error
- [ ] Strips commas on paste

### Integration
- [ ] QuoteForm uses AmountInput component
- [ ] Quote API receives correct smallest-unit value
- [ ] Submit disabled when amount invalid or exceeds balance

## Status

Not started.

## Output when complete

`DONE`
