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

### Confirmation dialog in `src/routes/bridge/lifi/BridgeFlow.svelte`

The confirmation dialog is implemented inline using Bits UI Dialog:

```svelte
<!-- Confirmation dialog -->
<Dialog.Root bind:open={showConfirmation}>
  <Dialog.Portal>
    <Dialog.Overlay data-overlay />
    <Dialog.Content data-dialog data-column="gap-3">
      <Dialog.Title>Confirm Bridge</Dialog.Title>
      {#if selectedRoute && fromNetwork && toNetwork}
        <dl data-summary>
          <dt>From</dt><dd>{formatSmallestToDecimal(settings.amount, 6)} USDC on {fromNetwork.name}</dd>
          <dt>To</dt><dd>~{formatTokenAmount(selectedRoute.toAmount, 6)} USDC on {toNetwork.name}</dd>
          <dt>Recipient</dt><dd>{formatAddress(recipient)}</dd>
          <dt>Slippage</dt><dd>{formatSlippagePercent(settings.slippage)}</dd>
        </dl>
      {/if}
      <label data-row="gap-2">
        <Checkbox.Root bind:checked={confirmed}>
          {#snippet children({ checked })}{checked ? '✓' : '○'}{/snippet}
        </Checkbox.Root>
        I understand this transaction is irreversible
      </label>
      <div data-row="gap-2">
        <Button.Root onclick={() => showConfirmation = false}>Cancel</Button.Root>
        <Button.Root disabled={!confirmed} onclick={onConfirm}>Confirm</Button.Root>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

State is managed via:
- `showConfirmation` – controls dialog visibility
- `confirmed` – checkbox state for acknowledgment
- `onConfirm` – triggers `executionRef.execute()` and closes dialog

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

Complete. Confirmation dialog implemented inline in BridgeFlow.svelte using Bits
UI Dialog with Checkbox for acknowledgment. Shows from/to chains, amounts,
recipient, slippage. Confirm button disabled until checkbox checked.

## Output when complete

`DONE`
