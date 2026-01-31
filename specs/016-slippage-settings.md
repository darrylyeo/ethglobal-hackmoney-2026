# Spec 016: Slippage tolerance settings

Allow users to set slippage tolerance for bridge transactions to handle price
movements between quote and execution.

## Requirements

1. **Slippage setting:**
   - Default: 0.5%
   - Presets: 0.1%, 0.5%, 1.0%
   - Custom input: 0.01% to 50%

2. **Slippage display:**
   - Show current slippage setting
   - Show minimum guaranteed output based on slippage

3. **Pass to LI.FI:**
   - Include `slippage` parameter in quote/route requests
   - LI.FI uses 0-1 scale (0.005 = 0.5%)

## Implementation

### Slippage constants

```typescript
// src/constants/slippage.ts
export const SLIPPAGE_PRESETS = [0.001, 0.005, 0.01] as const // 0.1%, 0.5%, 1%
export const DEFAULT_SLIPPAGE = 0.005 // 0.5%
export const MIN_SLIPPAGE = 0.0001 // 0.01%
export const MAX_SLIPPAGE = 0.5 // 50%

export const formatSlippagePercent = (slippage: number): string => (
  `${(slippage * 100).toFixed(2).replace(/\.?0+$/, '')}%`
)

export const parseSlippagePercent = (value: string): number | null => {
  const num = parseFloat(value.replace('%', ''))
  if (isNaN(num)) return null
  const slippage = num / 100
  if (slippage < MIN_SLIPPAGE || slippage > MAX_SLIPPAGE) return null
  return slippage
}

export const calculateMinOutput = (
  estimatedOutput: bigint,
  slippage: number,
): bigint => {
  const factor = BigInt(Math.floor((1 - slippage) * 1_000_000))
  return (estimatedOutput * factor) / 1_000_000n
}
```

### `src/routes/bridge/SlippageSettings.svelte`

```svelte
<script lang="ts">
  import { Button, Popover } from 'bits-ui'
  import {
    SLIPPAGE_PRESETS,
    DEFAULT_SLIPPAGE,
    formatSlippagePercent,
    parseSlippagePercent,
  } from '$/constants/slippage'

  let {
    value = $bindable(DEFAULT_SLIPPAGE),
  }: {
    value?: number
  } = $props()

  let customInput = $state('')
  let isCustom = $derived(!SLIPPAGE_PRESETS.includes(value as typeof SLIPPAGE_PRESETS[number]))

  const setPreset = (preset: number) => {
    value = preset
    customInput = ''
  }

  const setCustom = () => {
    const parsed = parseSlippagePercent(customInput)
    if (parsed !== null) {
      value = parsed
    }
  }
</script>

<Popover.Root>
  <Popover.Trigger data-slippage-trigger>
    Slippage: {formatSlippagePercent(value)}
  </Popover.Trigger>
  <Popover.Content data-slippage-popover>
    <div data-slippage-presets>
      {#each SLIPPAGE_PRESETS as preset (preset)}
        <Button.Root
          type="button"
          onclick={() => setPreset(preset)}
          data-selected={value === preset ? '' : undefined}
        >
          {formatSlippagePercent(preset)}
        </Button.Root>
      {/each}
    </div>
    <div data-slippage-custom>
      <input
        type="text"
        inputmode="decimal"
        placeholder="Custom %"
        bind:value={customInput}
        onchange={setCustom}
      />
    </div>
    {#if value > 0.01}
      <p data-slippage-warning>High slippage may result in unfavorable rates</p>
    {/if}
  </Popover.Content>
</Popover.Root>

<style>
  [data-slippage-presets] {
    display: flex;
    gap: 0.5em;
  }

  [data-slippage-presets] button[data-selected] {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
  }

  [data-slippage-warning] {
    color: var(--color-warning, #f59e0b);
    font-size: 0.875em;
  }
</style>
```

### LI.FI integration

Update `src/api/lifi.ts`:

```typescript
export type QuoteParams = {
  fromChain: number
  toChain: number
  fromAmount: string
  fromAddress: `0x${string}`
  slippage?: number // 0-1 scale, default 0.005
}

export async function getQuoteForUsdcBridge(
  params: QuoteParams,
): Promise<NormalizedQuote> {
  const { fromChain, toChain, fromAmount, fromAddress, slippage = 0.005 } = params
  const step = await getQuote({
    fromChain,
    toChain,
    fromToken: getUsdcAddress(fromChain),
    toToken: getUsdcAddress(toChain),
    fromAmount,
    fromAddress,
    slippage, // Pass to LI.FI
  })
  return normalizeQuote(step)
}
```

### Quote output enhancement

Show minimum guaranteed output:

```svelte
{@const minOutput = calculateMinOutput(
  BigInt(quote.estimatedToAmount),
  slippage
)}
<p>
  Estimated: {formatTokenAmount(quote.estimatedToAmount, 6)} USDC
</p>
<p>
  Minimum (with {formatSlippagePercent(slippage)} slippage):
  {formatTokenAmount(minOutput.toString(), 6)} USDC
</p>
```

## Acceptance criteria

### Slippage functions
- [ ] `formatSlippagePercent(0.005)` returns `'0.5%'`
- [ ] `parseSlippagePercent('1%')` returns `0.01`
- [ ] `parseSlippagePercent('0.001%')` returns `null` (below min)
- [ ] `calculateMinOutput(1000000n, 0.005)` returns `995000n`

### SlippageSettings component
- [ ] Shows current slippage percentage
- [ ] Preset buttons for 0.1%, 0.5%, 1%
- [ ] Custom input accepts valid percentages
- [ ] Invalid custom input ignored
- [ ] High slippage (>1%) shows warning

### Integration
- [ ] Default slippage is 0.5%
- [ ] Slippage passed to `getQuote()` and `getRoutes()`
- [ ] Quote output shows minimum guaranteed amount
- [ ] Slippage setting persists in localStorage

## Status

Not started.

## Output when complete

`DONE`
