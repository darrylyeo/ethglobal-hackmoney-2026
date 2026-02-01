# Spec 028: Security checklist

Security considerations and best practices for the bridge application.

## Requirements

This is a checklist spec—no new features, but verification that security practices
are followed throughout the codebase.

## Checklist

### Wallet interaction

- [x] **Never store private keys** – Only interact via EIP-1193 provider
- [x] **Validate addresses** – Check format before using in transactions
- [x] **Checksum addresses** – Use EIP-55 checksummed addresses in display
- [x] **Confirm before signing** – Show confirmation dialog before any transaction
- [x] **Clear signing context** – User sees exactly what they're signing
- [x] **Handle disconnection** – Clear sensitive state when wallet disconnects

### Transaction safety

- [x] **Amount validation** – Prevent sending more than balance
- [x] **Approval limits** – Warn about unlimited approvals
- [x] **Slippage warnings** – Alert on high slippage settings
- [x] **Quote freshness** – Prevent executing expired quotes
- [x] **Chain verification** – Ensure wallet is on correct chain before tx
- [x] **Recipient verification** – Confirm recipient address is intentional

### API and data

- [x] **No secrets in client** – API keys not exposed in browser
- [x] **HTTPS only** – All external requests over HTTPS
- [x] **Input sanitization** – Validate all user inputs
- [x] **Error handling** – Don't expose internal errors to users
- [x] **Rate limiting awareness** – Handle 429 responses gracefully

### State management

- [x] **Clear on logout** – Sensitive data cleared when disconnecting
- [x] **No sensitive localStorage** – Don't store private data in localStorage
- [x] **Session isolation** – Data scoped to connected wallet

### Display security

- [x] **XSS prevention** – No `{@html}` with user data
- [x] **External links** – Use `rel="noopener noreferrer"` on external links
- [x] **Address truncation** – Show enough chars to verify (0x1234...5678)
- [x] **Phishing awareness** – Clear branding, no confusing similar UIs

### Dependencies

- [x] **Minimal dependencies** – Only necessary packages
- [x] **Version pinning** – Lock dependency versions
- [x] **Audit trail** – Track dependency updates
- [x] **Subresource integrity** – SRI for CDN resources (if any)

## Implementation notes

### Address validation

```typescript
// Always validate before use
const isValidAddress = (addr: string): addr is `0x${string}` => (
  /^0x[a-fA-F0-9]{40}$/.test(addr)
)

// Use in forms
if (!isValidAddress(recipientInput)) {
  throw new Error('Invalid address format')
}
```

### Amount bounds checking

```typescript
// Never trust user input for amounts
const validateAmount = (
  amount: bigint,
  balance: bigint,
  min: bigint,
  max: bigint,
): { valid: boolean; error?: string } => {
  if (amount <= 0n) return { valid: false, error: 'Amount must be positive' }
  if (amount > balance) return { valid: false, error: 'Exceeds balance' }
  if (amount < min) return { valid: false, error: `Minimum is ${min}` }
  if (amount > max) return { valid: false, error: `Maximum is ${max}` }
  return { valid: true }
}
```

### Secure external links

```svelte
<a
  href={explorerUrl}
  target="_blank"
  rel="noopener noreferrer"
>
  View on Explorer
</a>
```

### Clear state on disconnect

```typescript
const disconnect = () => {
  // Clear all sensitive state
  state.connectedDetail = null
  state.address = null
  state.chainId = null

  // Clear any cached balances
  actorCoinsCollection.clear()

  // Clear transaction state
  quote = null
  selectedRoute = null
  txStatus = createInitialStatus()
}
```

### Quote expiration check

```typescript
const canExecute = (quote: NormalizedQuote, fetchedAt: number): boolean => {
  const QUOTE_TTL = 60_000 // 60 seconds
  return Date.now() - fetchedAt < QUOTE_TTL
}

// Before executing
if (!canExecute(quote, quoteFetchedAt)) {
  throw new Error('Quote expired. Please refresh.')
}
```

### Approval amount warning

```svelte
{#if unlimited}
  <div data-security-warning role="alert">
    <strong>⚠️ Unlimited approval</strong>
    <p>
      This allows the contract to spend any amount of your USDC.
      Consider using exact amount approval for better security.
    </p>
  </div>
{/if}
```

## Verification steps

### Manual audit

1. Review all `eth_sendTransaction` calls
2. Check all external API calls
3. Verify localStorage usage
4. Audit `{@html}` usage (should be none)
5. Check for console.log of sensitive data

### Automated checks

```bash
# Check for potential issues
rg --type=svelte '@html' src/
rg --type=ts 'localStorage\.setItem' src/
rg --type=ts 'console\.log' src/
rg 'http://' src/  # Should only be https://
```

## Acceptance criteria

- [x] All checklist items verified
- [x] No `{@html}` with user-controlled content
- [x] No secrets in client-side code
- [x] All external links have `rel="noopener noreferrer"`
- [x] Address validation on all address inputs
- [x] Amount validation before transactions
- [x] Confirmation required before signing
- [x] State cleared on wallet disconnect
- [x] No sensitive data in localStorage

## Status

Complete. NavigationItem: escapeHtml for all @html (icon, title, highlightText);
external links rel="noopener noreferrer". Wallets.svelte: disconnect clears
connection state. BridgeFlow: $effect clears actorCoins query when wallet address
is null; isValidAddress for recipient; validateBridgeAmount for amounts;
confirmation dialog before send. TokenApproval: warning when unlimited approval.
localStorage: theme, testnet settings, tx history by address (no private data).
Automated checks: @html only with escapeHtml; external links have noopener
noreferrer.

## Output when complete

`DONE`
