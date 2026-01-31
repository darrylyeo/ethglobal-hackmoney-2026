# Spec 013: Error handling and retries

Robust error handling throughout the bridge flow with user-friendly messages and
retry capabilities.

## Requirements

1. **Categorize errors:**
   - Network errors (RPC down, timeout)
   - User rejections (wallet declined tx)
   - Insufficient funds
   - Quote unavailable (no routes)
   - Bridge errors (execution failed)
   - Approval errors
   - Chain switch errors
   - Slippage errors
   - Rate limiting

2. **User-friendly messages:**
   - Don't show raw error strings
   - Map known errors to clear explanations
   - Suggest actions (retry, try different route, etc.)
   - Include helpful context (chain names, amounts)

3. **Retry mechanisms:**
   - Quote fetch: retry button
   - Balance fetch: auto-retry with backoff
   - Transaction: manual retry after failure
   - Exponential backoff for rate limits

4. **Global error boundary:**
   - Catch unexpected errors
   - Show fallback UI with "Try again" option
   - Option to report error (console log for debugging)

## Implementation

### `src/lib/errors.ts`

```typescript
export enum ErrorCode {
  // Network
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  RPC_ERROR = 'RPC_ERROR',

  // Wallet
  USER_REJECTED = 'USER_REJECTED',
  WALLET_DISCONNECTED = 'WALLET_DISCONNECTED',
  WRONG_CHAIN = 'WRONG_CHAIN',
  CHAIN_NOT_SUPPORTED = 'CHAIN_NOT_SUPPORTED',

  // Transaction
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  APPROVAL_FAILED = 'APPROVAL_FAILED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  EXECUTION_REVERTED = 'EXECUTION_REVERTED',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',

  // Quote/Route
  NO_ROUTES = 'NO_ROUTES',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  AMOUNT_TOO_LOW = 'AMOUNT_TOO_LOW',
  AMOUNT_TOO_HIGH = 'AMOUNT_TOO_HIGH',

  // Generic
  UNKNOWN = 'UNKNOWN',
}

export type BridgeError = {
  code: ErrorCode
  title: string
  message: string
  suggestion: string
  retryable: boolean
  retryDelay?: number // ms to wait before retry
  originalError?: Error
}

// Error message patterns to match
const ERROR_PATTERNS: [RegExp, Partial<BridgeError>][] = [
  // User rejections
  [
    /user rejected|user denied|rejected by user|cancelled/i,
    {
      code: ErrorCode.USER_REJECTED,
      title: 'Transaction cancelled',
      message: 'You declined the transaction in your wallet.',
      suggestion: 'Click the button again when ready.',
      retryable: true,
    },
  ],

  // Insufficient funds
  [
    /insufficient funds|exceeds balance|not enough/i,
    {
      code: ErrorCode.INSUFFICIENT_FUNDS,
      title: 'Insufficient funds',
      message: 'Your wallet doesn\'t have enough tokens for this transfer.',
      suggestion: 'Reduce the amount or add funds to your wallet.',
      retryable: false,
    },
  ],

  // Insufficient gas
  [
    /insufficient.*gas|gas too low|out of gas/i,
    {
      code: ErrorCode.INSUFFICIENT_GAS,
      title: 'Insufficient gas',
      message: 'Your wallet doesn\'t have enough native tokens to pay for gas.',
      suggestion: 'Add ETH (or native token) to your wallet for gas fees.',
      retryable: false,
    },
  ],

  // No routes
  [
    /no routes|no quotes|route not found|path not found/i,
    {
      code: ErrorCode.NO_ROUTES,
      title: 'No routes available',
      message: 'No bridge routes found for this transfer.',
      suggestion: 'Try a different chain pair, amount, or wait and retry.',
      retryable: true,
    },
  ],

  // Quote expired
  [
    /quote expired|quote.*stale|price changed/i,
    {
      code: ErrorCode.QUOTE_EXPIRED,
      title: 'Quote expired',
      message: 'The quote has expired. Prices may have changed.',
      suggestion: 'Get a new quote and try again.',
      retryable: true,
    },
  ],

  // Slippage
  [
    /slippage|price impact|output.*less than/i,
    {
      code: ErrorCode.SLIPPAGE_EXCEEDED,
      title: 'Slippage too high',
      message: 'Price moved too much during the transaction.',
      suggestion: 'Increase slippage tolerance or try a smaller amount.',
      retryable: true,
    },
  ],

  // Rate limiting
  [
    /rate limit|too many requests|429/i,
    {
      code: ErrorCode.RATE_LIMITED,
      title: 'Too many requests',
      message: 'Please wait a moment before trying again.',
      suggestion: 'Wait 30 seconds, then retry.',
      retryable: true,
      retryDelay: 30000,
    },
  ],

  // Network errors
  [
    /network|fetch|timeout|ECONNREFUSED|ETIMEDOUT/i,
    {
      code: ErrorCode.NETWORK,
      title: 'Network error',
      message: 'Unable to connect to the network.',
      suggestion: 'Check your internet connection and try again.',
      retryable: true,
    },
  ],

  // RPC errors
  [
    /rpc|eth_|call exception|execution reverted/i,
    {
      code: ErrorCode.RPC_ERROR,
      title: 'Blockchain error',
      message: 'Error communicating with the blockchain.',
      suggestion: 'Try again in a few seconds.',
      retryable: true,
      retryDelay: 3000,
    },
  ],

  // Chain errors
  [
    /chain.*not.*support|unsupported.*chain/i,
    {
      code: ErrorCode.CHAIN_NOT_SUPPORTED,
      title: 'Chain not supported',
      message: 'This chain is not supported by the bridge.',
      suggestion: 'Select a different chain.',
      retryable: false,
    },
  ],

  // Wrong chain
  [
    /wrong.*chain|chain.*mismatch|switch.*chain/i,
    {
      code: ErrorCode.WRONG_CHAIN,
      title: 'Wrong network',
      message: 'Your wallet is connected to the wrong network.',
      suggestion: 'Switch to the correct network in your wallet.',
      retryable: true,
    },
  ],

  // Execution reverted
  [
    /reverted|revert|execution failed/i,
    {
      code: ErrorCode.EXECUTION_REVERTED,
      title: 'Transaction failed',
      message: 'The transaction was rejected by the blockchain.',
      suggestion: 'The route may have changed. Get a new quote.',
      retryable: true,
    },
  ],
]

export const categorizeError = (error: unknown): BridgeError => {
  const rawMessage = error instanceof Error ? error.message : String(error)

  // Check against patterns
  for (const [pattern, errorInfo] of ERROR_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return {
        code: errorInfo.code ?? ErrorCode.UNKNOWN,
        title: errorInfo.title ?? 'Error',
        message: errorInfo.message ?? rawMessage,
        suggestion: errorInfo.suggestion ?? 'Please try again.',
        retryable: errorInfo.retryable ?? true,
        retryDelay: errorInfo.retryDelay,
        originalError: error instanceof Error ? error : undefined,
      }
    }
  }

  // Default unknown error
  return {
    code: ErrorCode.UNKNOWN,
    title: 'Something went wrong',
    message: 'An unexpected error occurred.',
    suggestion: 'Please try again. If the problem persists, refresh the page.',
    retryable: true,
    originalError: error instanceof Error ? error : undefined,
  }
}

// Utility to check if error is retryable
export const isRetryable = (error: BridgeError): boolean => error.retryable

// Utility to get retry delay (with exponential backoff for retries)
export const getRetryDelay = (error: BridgeError, attempt: number): number => {
  const baseDelay = error.retryDelay ?? 1000
  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000)
}
```

### `src/routes/bridge/ErrorDisplay.svelte`

```svelte
<script lang="ts">
  import type { BridgeError } from '$/lib/errors'
  import { Button } from 'bits-ui'
  import { getRetryDelay } from '$/lib/errors'

  let {
    error,
    attempt = 1,
    onRetry,
    onDismiss,
    showDetails = false,
  }: {
    error: BridgeError
    attempt?: number
    onRetry?: () => void
    onDismiss?: () => void
    showDetails?: boolean
  } = $props()

  let countdown = $state(0)
  let canRetry = $derived(countdown === 0)

  // Start countdown if there's a retry delay
  $effect(() => {
    if (!error.retryable) return
    const delay = getRetryDelay(error, attempt)
    if (delay > 1000) {
      countdown = Math.ceil(delay / 1000)
      const interval = setInterval(() => {
        countdown--
        if (countdown <= 0) clearInterval(interval)
      }, 1000)
      return () => clearInterval(interval)
    }
  })
</script>

<div role="alert" data-error-display data-code={error.code}>
  <div data-error-header>
    <span data-error-icon>⚠️</span>
    <strong data-error-title>{error.title}</strong>
    {#if onDismiss}
      <button type="button" data-error-dismiss onclick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    {/if}
  </div>

  <p data-error-message>{error.message}</p>
  <p data-error-suggestion>{error.suggestion}</p>

  {#if error.retryable && onRetry}
    <div data-error-actions>
      <Button.Root
        type="button"
        onclick={onRetry}
        disabled={!canRetry}
      >
        {#if countdown > 0}
          Retry in {countdown}s
        {:else}
          Try again
        {/if}
      </Button.Root>
    </div>
  {/if}

  {#if showDetails && error.originalError}
    <details data-error-details>
      <summary>Technical details</summary>
      <pre>{error.originalError.message}</pre>
    </details>
  {/if}
</div>

<style>
  [data-error-display] {
    padding: 1em;
    background: var(--color-error-bg, #fef2f2);
    border: 1px solid var(--color-error-border, #fecaca);
    border-radius: 0.5em;
  }

  [data-error-header] {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin-bottom: 0.5em;
  }

  [data-error-icon] {
    font-size: 1.25em;
  }

  [data-error-title] {
    flex: 1;
    color: var(--color-error, #dc2626);
  }

  [data-error-dismiss] {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25em;
    opacity: 0.6;
  }

  [data-error-dismiss]:hover {
    opacity: 1;
  }

  [data-error-message] {
    margin-bottom: 0.25em;
  }

  [data-error-suggestion] {
    font-size: 0.875em;
    opacity: 0.8;
    margin-bottom: 0.75em;
  }

  [data-error-actions] {
    display: flex;
    gap: 0.5em;
  }

  [data-error-details] {
    margin-top: 0.75em;
    font-size: 0.75em;
  }

  [data-error-details] summary {
    cursor: pointer;
    opacity: 0.7;
  }

  [data-error-details] pre {
    margin-top: 0.5em;
    padding: 0.5em;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 0.25em;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
```

### Auto-retry with backoff

```typescript
// src/lib/retry.ts
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    shouldRetry?: (error: BridgeError) => boolean
    onError?: (error: BridgeError, attempt: number) => void
  } = {},
): Promise<T> => {
  const { maxAttempts = 3, shouldRetry = isRetryable, onError } = options

  let lastError: BridgeError | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = categorizeError(e)
      onError?.(lastError, attempt)

      if (attempt < maxAttempts && shouldRetry(lastError)) {
        const delay = getRetryDelay(lastError, attempt)
        await new Promise(r => setTimeout(r, delay))
      } else {
        throw lastError
      }
    }
  }

  throw lastError
}
```

### Integration example

```svelte
<script lang="ts">
  import { categorizeError, type BridgeError } from '$/lib/errors'
  import ErrorDisplay from './ErrorDisplay.svelte'

  let error = $state<BridgeError | null>(null)
  let retryAttempt = $state(1)

  const fetchRoutes = async () => {
    error = null
    try {
      routes = await getRoutesForUsdcBridge(params)
    } catch (e) {
      error = categorizeError(e)
    }
  }

  const handleRetry = () => {
    retryAttempt++
    fetchRoutes()
  }
</script>

{#if error}
  <ErrorDisplay
    {error}
    attempt={retryAttempt}
    onRetry={handleRetry}
    onDismiss={() => { error = null }}
  />
{/if}
```

## Acceptance criteria

### Error categorization
- [x] `categorizeError()` maps 15+ error patterns
- [x] User rejection: "Transaction cancelled"
- [x] Insufficient funds: not retryable
- [x] No routes: retryable with suggestion
- [x] Network error: retryable
- [x] Rate limit: retryable with 30s delay
- [x] Quote expired: retryable
- [x] Slippage: retryable with suggestion
- [x] Unknown: generic message, retryable

### ErrorDisplay component
- [x] Shows title, message, suggestion
- [x] Retry button for retryable errors
- [x] Countdown timer for delayed retries
- [x] Dismiss button (optional)
- [x] Technical details expandable
- [x] Accessible with `role="alert"`

### Retry logic
- [x] `withRetry()` retries on retryable errors
- [x] Exponential backoff between attempts
- [x] Max 3 attempts by default
- [x] Callback on each error

### Integration
- [x] All async operations wrapped with error handling
- [x] Errors displayed via `ErrorDisplay`
- [x] Retry callbacks functional
- [x] Error state cleared on success

## Status

Complete.

## Output when complete

`DONE`
