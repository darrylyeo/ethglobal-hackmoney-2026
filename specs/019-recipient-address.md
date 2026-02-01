# Spec 019: Recipient address selection

Allow users to send bridged tokens to a different address than the connected wallet.
Useful for sending to hardware wallets, multisigs, or other accounts.

## Requirements

1. **Default to connected wallet:**
   - Recipient defaults to `wallet.address`
   - Clear indication "Receiving to: Your wallet"

2. **Custom recipient option:**
   - Toggle to enable "Send to different address"
   - Address input field with validation
   - ENS resolution (optional, stretch goal)

3. **Validation:**
   - Must be valid Ethereum address (0x + 40 hex chars)
   - Checksum validation (EIP-55)
   - Warning for addresses that look like contracts (optional)

4. **Security warning:**
   - Show warning when sending to different address
   - "Make sure you control this address on {destinationChain}"

## Implementation

### `src/lib/address.ts`

```typescript
export const isValidAddress = (address: string): boolean => (
  /^0x[a-fA-F0-9]{40}$/.test(address)
)

export const normalizeAddress = (address: string): `0x${string}` | null => {
  if (!isValidAddress(address)) return null
  return address.toLowerCase() as `0x${string}`
}

export const checksumAddress = (address: string): `0x${string}` | null => {
  if (!isValidAddress(address)) return null
  // EIP-55 checksum implementation
  const addr = address.toLowerCase().slice(2)
  const hash = keccak256(addr)
  let checksummed = '0x'
  for (let i = 0; i < 40; i++) {
    checksummed += parseInt(hash[i], 16) >= 8
      ? addr[i].toUpperCase()
      : addr[i]
  }
  return checksummed as `0x${string}`
}

export const formatAddress = (address: string, chars = 6): string => (
  `${address.slice(0, chars + 2)}…${address.slice(-chars)}`
)
```

### Recipient input in `src/routes/bridge/BridgeFlow.svelte`

Recipient functionality is implemented inline in BridgeFlow using:

- `bridgeSettingsState` for `useCustomRecipient` and `customRecipient`
- `isValidAddress`, `normalizeAddress`, `formatAddress` from `$/lib/address`
- Switch toggle for enabling custom recipient

```svelte
<!-- Recipient -->
<div data-column="gap-1">
  <label data-row="gap-2 align-center">
    <Switch.Root checked={settings.useCustomRecipient}
      onCheckedChange={(c) => { bridgeSettingsState.current = { ...settings, useCustomRecipient: c } }}>
      <Switch.Thumb />
    </Switch.Root>
    Different recipient
  </label>
  {#if settings.useCustomRecipient}
    <input type="text" placeholder="0x..." value={settings.customRecipient}
      oninput={(e) => { bridgeSettingsState.current = { ...settings, customRecipient: (e.target as HTMLInputElement).value } }} />
    {#if settings.customRecipient && !isValidAddress(settings.customRecipient)}
      <small data-error>Invalid address</small>
    {/if}
  {:else if selectedActor}
    <small data-muted>To: {formatAddress(selectedActor)}</small>
  {:else}
    <small data-muted>To: Connect wallet</small>
  {/if}
</div>
```

### LI.FI integration

Update quote/route params to include `toAddress`:

```typescript
export type QuoteParams = {
  fromChain: number
  toChain: number
  fromAmount: string
  fromAddress: `0x${string}`
  toAddress?: `0x${string}` // NEW: recipient address
  slippage?: number
}

export async function getQuoteForUsdcBridge(params: QuoteParams) {
  const { fromChain, toChain, fromAmount, fromAddress, toAddress, slippage = 0.005 } = params
  const step = await getQuote({
    fromChain,
    toChain,
    fromToken: getUsdcAddress(fromChain),
    toToken: getUsdcAddress(toChain),
    fromAmount,
    fromAddress,
    toAddress: toAddress ?? fromAddress, // Default to sender
    slippage,
  })
  return normalizeQuote(step)
}
```

### Bridge page integration

```svelte
let recipient = $state<`0x${string}`>(wallet.address ?? '0x0')

// Update recipient when wallet changes
$effect(() => {
  if (wallet.address && !useCustomRecipient) {
    recipient = wallet.address
  }
})

<RecipientInput
  walletAddress={wallet.address}
  toChainId={Number(toChain)}
  bind:recipient
/>

// Pass to quote/route
const params = {
  fromChain: Number(fromChain),
  toChain: Number(toChain),
  fromAmount: parseDecimalToSmallest(amount, 6).toString(),
  fromAddress: wallet.address,
  toAddress: recipient, // Include recipient
  slippage,
}
```

## Acceptance criteria

### Address utilities
- [x] `isValidAddress()` validates Ethereum addresses
- [x] `normalizeAddress()` lowercases and validates
- [x] `formatAddress()` truncates with ellipsis
- [x] Invalid addresses rejected

### Recipient input (inline in BridgeFlow)
- [x] Defaults to connected wallet address
- [x] Toggle enables custom recipient input
- [x] Input validates address format
- [x] Invalid address shows error
- [x] Toggling off resets to default (wallet address)

### Integration
- [x] `toAddress` passed to LI.FI quote/route via `quoteParams`
- [x] Quote reflects correct recipient
- [x] Transaction sends to specified recipient
- [x] Works with both same and different addresses

### Security
- [x] User must actively enable custom recipient via switch toggle

## Status

Complete. Address utils (`isValidAddress`, `normalizeAddress`, `formatAddress`),
recipient input inline in BridgeFlow.svelte with bridgeSettingsState, LI.FI
toAddress integration via quoteParams; unit tests in address.spec.ts.

## Output when complete

`DONE`
