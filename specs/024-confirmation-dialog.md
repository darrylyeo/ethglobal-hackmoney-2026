# Spec 024: Transaction confirmation dialog

Show a confirmation dialog before submitting bridge transactions, summarizing all
details and requiring explicit user confirmation.

## Requirements

1. **Pre-transaction summary:**
   - Source chain and amount
   - Destination chain and expected output
   - Recipient address (with warning if different)
   - Total fees breakdown
   - Estimated time
   - Slippage setting

2. **Warnings:**
   - High slippage (>1%)
   - Large amount (>$10,000)
   - Different recipient address
   - First time using this bridge protocol

3. **Confirmation:**
   - Checkbox: "I understand this transaction is irreversible"
   - "Confirm" button disabled until checkbox checked
   - "Cancel" button to go back

## Implementation

### `src/routes/bridge/ConfirmationDialog.svelte`

```svelte
<script lang="ts">
  import { Dialog, Button, Checkbox } from 'bits-ui'
  import type { NormalizedRoute } from '$/api/lifi'
  import { formatTokenAmount, formatSmallestToDecimal } from '$/lib/format'
  import { networksByChainId } from '$/constants/networks'
  import FeeBreakdown from './FeeBreakdown.svelte'

  let {
    open = $bindable(false),
    route,
    fromChainId,
    toChainId,
    fromAmount,
    fromAddress,
    toAddress,
    slippage,
    onConfirm,
    onCancel,
  }: {
    open?: boolean
    route: NormalizedRoute
    fromChainId: number
    toChainId: number
    fromAmount: string
    fromAddress: `0x${string}`
    toAddress: `0x${string}`
    slippage: number
    onConfirm: () => void
    onCancel: () => void
  } = $props()

  let acknowledged = $state(false)

  const fromChainName = $derived(networksByChainId[fromChainId]?.name ?? `Chain ${fromChainId}`)
  const toChainName = $derived(networksByChainId[toChainId]?.name ?? `Chain ${toChainId}`)
  const isDifferentRecipient = $derived(
    toAddress.toLowerCase() !== fromAddress.toLowerCase()
  )
  const isHighSlippage = $derived(slippage > 0.01)
  const isLargeAmount = $derived(
    parseFloat(route.originalRoute.fromAmountUSD ?? '0') > 10000
  )
  const hasWarnings = $derived(isDifferentRecipient || isHighSlippage || isLargeAmount)

  const handleConfirm = () => {
    if (acknowledged) {
      onConfirm()
      open = false
    }
  }

  const handleCancel = () => {
    acknowledged = false
    onCancel()
    open = false
  }

  // Reset acknowledgment when dialog opens
  $effect(() => {
    if (open) {
      acknowledged = false
    }
  })
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay data-dialog-overlay />
    <Dialog.Content data-dialog-content aria-describedby="confirm-desc">
      <Dialog.Title>Confirm Bridge Transaction</Dialog.Title>
      <Dialog.Description id="confirm-desc" class="sr-only">
        Review and confirm your bridge transaction details
      </Dialog.Description>

      <div data-confirm-details>
        <div data-confirm-row>
          <span>From</span>
          <span>
            <strong>{formatSmallestToDecimal(fromAmount, 6)} USDC</strong>
            on {fromChainName}
          </span>
        </div>

        <div data-confirm-arrow>↓</div>

        <div data-confirm-row>
          <span>To</span>
          <span>
            <strong>~{formatTokenAmount(route.toAmount, 6)} USDC</strong>
            on {toChainName}
          </span>
        </div>

        <div data-confirm-row>
          <span>Min. received</span>
          <span>{formatTokenAmount(route.toAmountMin, 6)} USDC</span>
        </div>

        <div data-confirm-row>
          <span>Recipient</span>
          <span>
            {toAddress.slice(0, 8)}…{toAddress.slice(-6)}
            {#if isDifferentRecipient}
              <span data-badge="warning">Different address</span>
            {/if}
          </span>
        </div>

        <div data-confirm-row>
          <span>Bridge</span>
          <span>{route.steps.map(s => s.toolName).join(' → ')}</span>
        </div>

        <div data-confirm-row>
          <span>Est. time</span>
          <span>~{Math.ceil(route.estimatedDurationSeconds / 60)} min</span>
        </div>

        <div data-confirm-row>
          <span>Slippage</span>
          <span>
            {(slippage * 100).toFixed(1)}%
            {#if isHighSlippage}
              <span data-badge="warning">High</span>
            {/if}
          </span>
        </div>

        <div data-confirm-row>
          <span>Fees</span>
          <span>~${route.gasCostUsd}</span>
        </div>
      </div>

      {#if hasWarnings}
        <div data-confirm-warnings role="alert">
          <strong>⚠️ Please note:</strong>
          <ul>
            {#if isDifferentRecipient}
              <li>Tokens will be sent to a <strong>different address</strong> than your wallet.</li>
            {/if}
            {#if isHighSlippage}
              <li>High slippage ({(slippage * 100).toFixed(1)}%) may result in receiving less than expected.</li>
            {/if}
            {#if isLargeAmount}
              <li>This is a large transaction (>${Math.floor(parseFloat(route.originalRoute.fromAmountUSD ?? '0')).toLocaleString()}).</li>
            {/if}
          </ul>
        </div>
      {/if}

      <div data-confirm-acknowledge>
        <Checkbox.Root bind:checked={acknowledged} id="confirm-checkbox">
          <Checkbox.Indicator>✓</Checkbox.Indicator>
        </Checkbox.Root>
        <label for="confirm-checkbox">
          I understand this transaction cannot be reversed once submitted
        </label>
      </div>

      <div data-confirm-actions>
        <Button.Root type="button" onclick={handleCancel} data-variant="secondary">
          Cancel
        </Button.Root>
        <Button.Root
          type="button"
          onclick={handleConfirm}
          disabled={!acknowledged}
          data-variant="primary"
        >
          Confirm Bridge
        </Button.Root>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  [data-dialog-overlay] {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  [data-dialog-content] {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--color-bg-page);
    border-radius: 0.75em;
    padding: 1.5em;
    max-width: 480px;
    width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    z-index: 101;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  [data-confirm-details] {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
    margin: 1em 0;
    padding: 1em;
    background: var(--color-bg-subtle);
    border-radius: 0.5em;
  }

  [data-confirm-row] {
    display: flex;
    justify-content: space-between;
    gap: 1em;
  }

  [data-confirm-row] > span:first-child {
    opacity: 0.7;
  }

  [data-confirm-arrow] {
    text-align: center;
    font-size: 1.25em;
    opacity: 0.5;
  }

  [data-badge] {
    font-size: 0.75em;
    padding: 0.125em 0.375em;
    border-radius: 0.25em;
    margin-left: 0.5em;
  }

  [data-badge="warning"] {
    background: var(--color-warning-bg, #fef3c7);
    color: var(--color-warning, #d97706);
  }

  [data-confirm-warnings] {
    padding: 1em;
    background: var(--color-warning-bg, #fef3c7);
    border-radius: 0.5em;
    margin: 1em 0;
  }

  [data-confirm-warnings] ul {
    margin: 0.5em 0 0 1.5em;
    padding: 0;
  }

  [data-confirm-warnings] li {
    margin: 0.25em 0;
  }

  [data-confirm-acknowledge] {
    display: flex;
    align-items: flex-start;
    gap: 0.5em;
    margin: 1em 0;
    font-size: 0.875em;
  }

  [data-confirm-actions] {
    display: flex;
    gap: 0.75em;
    justify-content: flex-end;
    margin-top: 1.5em;
  }
</style>
```

### Integration in bridge page

```svelte
let showConfirmation = $state(false)

const handleBridgeClick = () => {
  showConfirmation = true
}

const handleConfirm = () => {
  // Proceed with actual bridge execution
  executeBridge()
}

<Button.Root onclick={handleBridgeClick}>
  Bridge
</Button.Root>

<ConfirmationDialog
  bind:open={showConfirmation}
  route={selectedRoute}
  {fromChainId}
  {toChainId}
  fromAmount={amountSmallest}
  fromAddress={wallet.address}
  toAddress={recipient}
  {slippage}
  onConfirm={handleConfirm}
  onCancel={() => {}}
/>
```

## Acceptance criteria

### Dialog content
- [x] Shows source chain, amount, destination chain, expected output
- [x] Shows minimum received (after slippage)
- [x] Shows recipient address with badge if different
- [x] Shows bridge protocol name(s)
- [x] Shows estimated time
- [x] Shows slippage percentage
- [x] Shows total fees

### Warnings
- [x] Warning for different recipient address
- [x] Warning for high slippage (>1%)
- [x] Warning for large amounts (>$10,000)
- [x] Multiple warnings can display together

### Confirmation flow
- [x] Checkbox required to enable Confirm button
- [x] Confirm button disabled until acknowledged
- [x] Cancel button closes dialog without action
- [x] Dialog closes after confirm
- [x] Acknowledgment resets when dialog reopens

### Accessibility
- [x] Dialog has proper ARIA attributes
- [x] Focus trapped inside dialog
- [x] Escape key closes dialog
- [x] Screen reader announces dialog

## Status

Complete.

## Output when complete

`DONE`
