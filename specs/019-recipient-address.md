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

### `src/routes/bridge/RecipientInput.svelte`

```svelte
<script lang="ts">
  import { Switch } from 'bits-ui'
  import { isValidAddress, normalizeAddress, formatAddress } from '$/lib/address'
  import { networksByChainId } from '$/constants/networks'

  let {
    walletAddress,
    toChainId,
    recipient = $bindable<`0x${string}`>(walletAddress),
  }: {
    walletAddress: `0x${string}`
    toChainId: number
    recipient?: `0x${string}`
  } = $props()

  let useCustomRecipient = $state(false)
  let customAddress = $state('')

  const isValid = $derived(
    !useCustomRecipient || isValidAddress(customAddress)
  )
  const normalized = $derived(
    useCustomRecipient
      ? normalizeAddress(customAddress)
      : walletAddress
  )
  const isDifferentAddress = $derived(
    normalized !== null && normalized.toLowerCase() !== walletAddress.toLowerCase()
  )
  const chainName = $derived(
    networksByChainId[toChainId]?.name ?? `Chain ${toChainId}`
  )

  // Sync to parent
  $effect(() => {
    recipient = normalized ?? walletAddress
  })

  const toggleCustom = (checked: boolean) => {
    useCustomRecipient = checked
    if (!checked) {
      customAddress = ''
    }
  }
</script>

<div data-recipient-input>
  <div data-recipient-toggle>
    <Switch.Root checked={useCustomRecipient} onCheckedChange={toggleCustom}>
      <Switch.Thumb />
    </Switch.Root>
    <span>Send to different address</span>
  </div>

  {#if useCustomRecipient}
    <div data-recipient-custom>
      <label for="recipient-address">Recipient address</label>
      <input
        id="recipient-address"
        type="text"
        placeholder="0x..."
        autocomplete="off"
        spellcheck="false"
        bind:value={customAddress}
        data-invalid={customAddress && !isValid ? '' : undefined}
      />
      {#if customAddress && !isValid}
        <p data-recipient-error role="alert">Invalid address format</p>
      {/if}
    </div>

    {#if isDifferentAddress && isValid}
      <div data-recipient-warning role="alert">
        <strong>⚠️ Sending to a different address</strong>
        <p>
          Tokens will be sent to <code>{formatAddress(normalized ?? '')}</code> on {chainName}.
          Make sure you control this address.
        </p>
      </div>
    {/if}
  {:else}
    <p data-recipient-default>
      Receiving to: <code>{formatAddress(walletAddress)}</code> (your wallet)
    </p>
  {/if}
</div>

<style>
  [data-recipient-toggle] {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  [data-recipient-custom] {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  [data-recipient-custom] input {
    font-family: var(--font-mono);
    font-size: 0.875em;
  }

  [data-recipient-custom] input[data-invalid] {
    border-color: var(--color-error, #ef4444);
  }

  [data-recipient-error] {
    color: var(--color-error, #ef4444);
    font-size: 0.875em;
  }

  [data-recipient-warning] {
    padding: 0.75em;
    background: var(--color-warning-bg, #fef3c7);
    border-radius: 0.5em;
    font-size: 0.875em;
  }

  [data-recipient-warning] code {
    font-family: var(--font-mono);
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125em 0.25em;
    border-radius: 0.25em;
  }

  [data-recipient-default] code {
    font-family: var(--font-mono);
  }
</style>
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
- [ ] `isValidAddress()` validates Ethereum addresses
- [ ] `normalizeAddress()` lowercases and validates
- [ ] `formatAddress()` truncates with ellipsis
- [ ] Invalid addresses rejected

### RecipientInput component
- [ ] Defaults to connected wallet address
- [ ] Toggle enables custom recipient input
- [ ] Input validates address format
- [ ] Invalid address shows error
- [ ] Different address shows warning with chain name
- [ ] Toggling off resets to wallet address

### Integration
- [ ] `toAddress` passed to LI.FI quote/route
- [ ] Quote reflects correct recipient
- [ ] Transaction sends to specified recipient
- [ ] Works with both same and different addresses

### Security
- [ ] Warning clearly states tokens go to different address
- [ ] Chain name shown in warning
- [ ] User must actively enable custom recipient

## Status

Complete. Address utils, RecipientInput, LI.FI toAddress, bridge page integration; unit tests for address.
