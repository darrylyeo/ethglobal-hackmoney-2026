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

2. **User-friendly messages:**
   - Don't show raw error strings
   - Map known errors to clear explanations
   - Suggest actions (retry, try different route, etc.)

3. **Retry mechanisms:**
   - Quote fetch: retry button
   - Balance fetch: auto-retry with backoff
   - Transaction: manual retry after failure

4. **Global error boundary:**
   - Catch unexpected errors
   - Show fallback UI with "Try again" option

## Implementation

### `src/lib/errors.ts`

```typescript
export enum ErrorCode {
  NETWORK = 'NETWORK',
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NO_ROUTES = 'NO_ROUTES',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export type BridgeError = {
  code: ErrorCode
  message: string
  suggestion: string
  retryable: boolean
  originalError?: Error
}

export const categorizeError = (error: unknown): BridgeError => {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('user rejected') || message.includes('User denied')) {
    return {
      code: ErrorCode.USER_REJECTED,
      message: 'Transaction cancelled',
      suggestion: 'Click the button again to retry.',
      retryable: true,
    }
  }

  if (message.includes('insufficient funds') || message.includes('exceeds balance')) {
    return {
      code: ErrorCode.INSUFFICIENT_FUNDS,
      message: 'Insufficient funds',
      suggestion: 'Reduce the amount or add funds to your wallet.',
      retryable: false,
    }
  }

  if (message.includes('No routes found') || message.includes('no quotes')) {
    return {
      code: ErrorCode.NO_ROUTES,
      message: 'No bridge routes available',
      suggestion: 'Try a different chain pair or amount.',
      retryable: true,
    }
  }

  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return {
      code: ErrorCode.NETWORK,
      message: 'Network error',
      suggestion: 'Check your connection and try again.',
      retryable: true,
    }
  }

  return {
    code: ErrorCode.UNKNOWN,
    message: 'Something went wrong',
    suggestion: 'Please try again.',
    retryable: true,
    originalError: error instanceof Error ? error : undefined,
  }
}
```

### `src/routes/bridge/ErrorDisplay.svelte`

```svelte
<script lang="ts">
  import type { BridgeError } from '$/lib/errors'
  import { Button } from 'bits-ui'

  let {
    error,
    onRetry,
  }: {
    error: BridgeError
    onRetry?: () => void
  } = $props()
</script>

<div role="alert" data-error-display>
  <p data-error-message>{error.message}</p>
  <p data-error-suggestion>{error.suggestion}</p>
  {#if error.retryable && onRetry}
    <Button.Root onclick={onRetry}>Try again</Button.Root>
  {/if}
</div>
```

### Integration

- Wrap error-throwing calls in try/catch
- Call `categorizeError()` on caught errors
- Display via `ErrorDisplay` component
- Pass retry callback for retryable errors

## Acceptance criteria

- [ ] `categorizeError()` maps known errors to `BridgeError`
- [ ] User rejection shows "Transaction cancelled" (not raw error)
- [ ] Insufficient funds error not marked retryable
- [ ] Network errors suggest checking connection
- [ ] `ErrorDisplay` component shows message + suggestion
- [ ] Retry button shown for retryable errors
- [ ] Retry button actually retries the operation
- [ ] Unknown errors show generic message with retry option

## Status

Not started.

## Output when complete

`DONE`
