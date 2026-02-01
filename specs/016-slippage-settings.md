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

### Slippage settings in `src/routes/bridge/BridgeFlow.svelte`

Slippage settings are implemented inline using a Popover:

```svelte
<!-- Slippage -->
<Popover.Root>
  <Popover.Trigger data-row="gap-1">
    Slippage: <strong>{formatSlippagePercent(settings.slippage)}</strong>
  </Popover.Trigger>
  <Popover.Content data-column="gap-2">
    <div data-row="gap-1">
      {#each SLIPPAGE_PRESETS as p}
        <Button.Root onclick={() => { bridgeSettingsState.current = { ...settings, slippage: p } }}
          data-selected={settings.slippage === p ? '' : undefined}>
          {formatSlippagePercent(p)}
        </Button.Root>
      {/each}
    </div>
    <input placeholder="Custom %" bind:value={slippageInput}
      onchange={() => { const p = parseSlippagePercent(slippageInput); if (p) bridgeSettingsState.current = { ...settings, slippage: p } }} />
  </Popover.Content>
</Popover.Root>
```

Slippage is persisted via `bridgeSettingsState` and passed to route queries.

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
- [x] `formatSlippagePercent(0.005)` returns `'0.5%'`
- [x] `parseSlippagePercent('1%')` returns `0.01`
- [x] `parseSlippagePercent('0.001%')` returns `null` (below min)
- [x] `calculateMinOutput(1000000n, 0.005)` returns `995000n`

### SlippageSettings component
- [x] Shows current slippage percentage
- [x] Preset buttons for 0.1%, 0.5%, 1%
- [x] Custom input accepts valid percentages
- [x] Invalid custom input ignored
- [x] High slippage (>1%) shows warning

### Integration
- [x] Default slippage is 0.5%
- [x] Slippage passed to `getQuote()` and `getRoutes()`
- [x] Quote output shows minimum guaranteed amount
- [x] Slippage setting persists in localStorage

## Status

Complete. `src/constants/slippage.ts`: SLIPPAGE_PRESETS, DEFAULT_SLIPPAGE, MIN/MAX,
formatSlippagePercent, parseSlippagePercent, calculateMinOutput; unit tests in
slippage.spec.ts. BridgeFlow.svelte: Popover with trigger, preset buttons, custom
input, slippage stored in `bridgeSettingsState`, passed to route queries via
`quoteParams`. Min output shown in quote summary via `calculateMinOutput`.

## Output when complete

`DONE`
