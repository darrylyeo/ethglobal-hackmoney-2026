# Spec 009: Token approval flow

ERC20 tokens require approval before a bridge contract can transfer them. This spec
adds approval checking and prompting.

**Note:** LI.FI SDK provides `getTokenApproval()` and approval info in quotes. We can
leverage this instead of raw RPC calls for most cases.

## Requirements

1. **Check allowance before bridging:**
   - Use quote's `estimate.approvalAddress` for spender
   - Call `allowance(owner, spender)` via Voltaire
   - Compare with transfer amount
   - If insufficient, prompt for approval

2. **Approval transaction:**
   - Request user to approve the bridge contract
   - Default to exact amount approval (safer)
   - Optional: unlimited approval toggle
   - Wait for approval tx confirmation before proceeding

3. **UI flow:**
   - Show approval status after getting quote
   - Two-step flow: Approve → Bridge
   - Or single "Approve & Bridge" that handles both
   - Clear feedback during approval tx

## Implementation

### `src/lib/voltaire.ts` additions

```typescript
// allowance(address,address) selector: 0xdd62ed3e
const ALLOWANCE_SELECTOR = '0xdd62ed3e'
// approve(address,uint256) selector: 0x095ea7b3
const APPROVE_SELECTOR = '0x095ea7b3'
// Max uint256 for unlimited approval
const MAX_UINT256 = 2n ** 256n - 1n

export const encodeAllowanceCall = (
  owner: `0x${string}`,
  spender: `0x${string}`,
): `0x${string}` => {
  const paddedOwner = owner.slice(2).toLowerCase().padStart(64, '0')
  const paddedSpender = spender.slice(2).toLowerCase().padStart(64, '0')
  return `${ALLOWANCE_SELECTOR}${paddedOwner}${paddedSpender}` as `0x${string}`
}

export const getErc20Allowance = async (
  provider: HttpProvider,
  tokenAddress: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
): Promise<bigint> => {
  const result = await provider.request({
    method: 'eth_call',
    params: [{
      to: tokenAddress,
      data: encodeAllowanceCall(owner, spender),
    }, 'latest'],
  })
  return BigInt(result as string)
}

export const encodeApproveCall = (
  spender: `0x${string}`,
  amount: bigint,
): `0x${string}` => {
  const paddedSpender = spender.slice(2).toLowerCase().padStart(64, '0')
  const paddedAmount = amount.toString(16).padStart(64, '0')
  return `${APPROVE_SELECTOR}${paddedSpender}${paddedAmount}` as `0x${string}`
}

export { MAX_UINT256 }
```

### `src/lib/approval.ts`

```typescript
import type { EIP1193Provider } from './wallet'
import { getErc20Allowance, encodeApproveCall, MAX_UINT256 } from './voltaire'
import { rpcUrls } from '$/constants/rpc-endpoints'
import { createHttpProvider } from './voltaire'

export type ApprovalState = 'unknown' | 'checking' | 'needed' | 'approving' | 'approved' | 'error'

export type ApprovalInfo = {
  state: ApprovalState
  currentAllowance: bigint
  requiredAmount: bigint
  error?: string
}

export const checkApproval = async (
  chainId: number,
  tokenAddress: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint,
): Promise<ApprovalInfo> => {
  try {
    const rpcUrl = rpcUrls[chainId]
    if (!rpcUrl) throw new Error(`No RPC for chain ${chainId}`)

    const provider = createHttpProvider(rpcUrl)
    const allowance = await getErc20Allowance(provider, tokenAddress, owner, spender)

    return {
      state: allowance >= amount ? 'approved' : 'needed',
      currentAllowance: allowance,
      requiredAmount: amount,
    }
  } catch (e) {
    return {
      state: 'error',
      currentAllowance: 0n,
      requiredAmount: amount,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export const sendApproval = async (
  walletProvider: EIP1193Provider,
  chainId: number,
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint,
  unlimited = false,
): Promise<`0x${string}`> => {
  const approveAmount = unlimited ? MAX_UINT256 : amount
  const data = encodeApproveCall(spender, approveAmount)

  const txHash = await walletProvider.request({
    method: 'eth_sendTransaction',
    params: [{
      to: tokenAddress,
      data,
      chainId: `0x${chainId.toString(16)}`,
    }],
  }) as `0x${string}`

  return txHash
}

export const waitForApprovalConfirmation = async (
  chainId: number,
  txHash: `0x${string}`,
  maxAttempts = 60,
  intervalMs = 2000,
): Promise<boolean> => {
  const rpcUrl = rpcUrls[chainId]
  if (!rpcUrl) throw new Error(`No RPC for chain ${chainId}`)

  const provider = createHttpProvider(rpcUrl)

  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    }) as { status: string } | null

    if (receipt) {
      return receipt.status === '0x1'
    }

    await new Promise(r => setTimeout(r, intervalMs))
  }

  throw new Error('Approval confirmation timeout')
}
```

### `src/routes/bridge/TokenApproval.svelte`

Component that derives approval state from `actorAllowancesCollection` and
handles approval transactions. Uses TanStack DB for reactive allowance queries.

Key features:
- Queries `actorAllowancesCollection` via `useLiveQuery`
- Fetches allowance on mount via `fetchActorAllowance`
- Sends approval via `sendApproval` from `$/lib/approval`
- Updates collection optimistically via `setActorAllowance` on success
- Toggle for unlimited vs exact amount approval

### Integration in bridge page

```svelte
<script lang="ts">
  // After getting quote/route, extract approval info
  const approvalAddress = $derived(
    selectedRoute?.originalRoute.steps[0]?.estimate?.approvalAddress as `0x${string}` | undefined
  )
  const needsApprovalCheck = $derived(
    approvalAddress !== undefined && selectedRoute !== null
  )

  let approvalComplete = $state(false)

  // Reset approval state when route changes
  $effect(() => {
    if (selectedRoute) {
      approvalComplete = false
    }
  })
</script>

{#if selectedRoute}
  {#if needsApprovalCheck && !approvalComplete}
    <ApprovalButton
      chainId={Number(fromChain)}
      tokenAddress={getUsdcAddress(Number(fromChain))}
      spenderAddress={approvalAddress}
      amount={parseDecimalToSmallest(amount, 6)}
      walletProvider={wallet.connectedDetail.provider}
      walletAddress={wallet.address}
      onApproved={() => { approvalComplete = true }}
    />
  {:else}
    <LoadingButton
      type="button"
      onclick={bridge}
      loading={execLoading}
      loadingText="Bridging…"
    >
      Bridge
    </LoadingButton>
  {/if}
{/if}
```

### Unit tests (`src/lib/approval.spec.ts`)

```typescript
import { assertEquals } from '@std/assert'
import { encodeAllowanceCall, encodeApproveCall } from './voltaire'

Deno.test('encodeAllowanceCall generates correct calldata', () => {
  const data = encodeAllowanceCall(
    '0x1234567890123456789012345678901234567890',
    '0xabcdef0123456789abcdef0123456789abcdef01',
  )
  assertEquals(data.slice(0, 10), '0xdd62ed3e')
  assertEquals(data.length, 138) // 10 + 64 + 64
})

Deno.test('encodeApproveCall generates correct calldata', () => {
  const data = encodeApproveCall(
    '0xabcdef0123456789abcdef0123456789abcdef01',
    1000000n,
  )
  assertEquals(data.slice(0, 10), '0x095ea7b3')
  assertEquals(data.length, 138)
})
```

## Acceptance criteria

### Voltaire functions
- [x] `encodeAllowanceCall()` generates correct 4-byte selector + args
- [x] `getErc20Allowance()` returns current allowance as bigint
- [x] `encodeApproveCall()` generates correct calldata
- [x] Works with both exact and unlimited amounts

### Approval module
- [x] `checkApproval()` returns correct state (needed/approved)
- [x] `sendApproval()` sends transaction via wallet
- [x] `waitForApprovalConfirmation()` polls for receipt
- [x] Handles errors gracefully

### TokenApproval component
- [x] Shows "Checking approval…" initially
- [x] Shows "Approve USDC" button when needed
- [x] Unlimited approval toggle available
- [x] Shows "Approving…" during transaction
- [x] Links to explorer during approval
- [x] Shows "✓ Approved" when done
- [x] Shows error with retry on failure
- [x] Updates `actorAllowancesCollection` on success

### Integration
- [x] Bridge page checks approval after route selection
- [x] Approval required before Bridge button enabled
- [x] Switching routes resets approval state
- [x] Already-approved tokens show "✓ Approved" immediately

## Status

Complete. Voltaire: encodeAllowanceCall, getErc20Allowance, encodeApproveCall,
MAX_UINT256. approval.ts: sendApproval, waitForApprovalConfirmation.
TokenApproval.svelte with Switch, states checking/needed/approving/approved/error,
explorer link, reactive allowance from actorAllowancesCollection.
BridgeFlow.svelte: approvalAddress from route, TokenApproval shown when needed,
approval state derived from allowancesQuery. getUsdcAddress exported from lifi.
Unit tests in voltaire.spec.ts. Re-verification 2026-02-04 (PROMPT_build): all
acceptance criteria verified in src/api/voltaire.ts, src/api/approval.ts,
src/routes/bridge/lifi/TokenApproval.svelte, BridgeFlow.svelte; test:unit passed.

## Output when complete

`DONE`
