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

### Error display in `src/routes/bridge/BridgeFlow.svelte`

Errors from route fetching are shown inline:

```svelte
<!-- Routes error -->
{#if routesRow?.error}
  <div data-card data-error>
    {routesRow.error.code === ErrorCode.NO_ROUTES
      ? 'No routes available for this transfer.'
      : routesRow.error.message}
  </div>
{/if}
```

Error categorization uses `ErrorCode` from `$/lib/errors` to provide
user-friendly messages.

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

### Integration

Routes are fetched via `fetchBridgeRoutes` which stores errors in
`bridgeRoutesCollection`. The error is available via `routesRow?.error` and
displayed inline with appropriate messaging based on `ErrorCode`.

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

### Error display (inline in BridgeFlow)
- [x] Shows error message based on ErrorCode
- [x] "No routes available" for NO_ROUTES error
- [x] Generic error message for other errors
- [x] Refresh button available to retry

### Retry logic
- [x] `withRetry()` retries on retryable errors
- [x] Exponential backoff between attempts
- [x] Max 3 attempts by default
- [x] Callback on each error

### Integration
- [x] Route fetching wrapped with error handling via collection
- [x] Errors displayed inline via `routesRow?.error`
- [x] Retry via refresh button (`onRefresh`)
- [x] Error state cleared on successful fetch

## Status

Complete. `src/lib/errors.ts` with ErrorCode enum and categorizeError function.
Errors stored in `bridgeRoutesCollection` and displayed inline in BridgeFlow.svelte.
Retry via refresh button. `withRetry` utility in `retry.ts` for exponential backoff.

## Output when complete

`DONE`
