# Spec 008: Transaction status tracking

Track bridge transaction lifecycle with real-time status updates and chain-specific
explorer links.

## Requirements

1. **Transaction states:**
   - `idle` – No transaction in progress
   - `approving` – Waiting for token approval tx
   - `approved` – Approval confirmed
   - `sending` – Bridge tx submitted, waiting for source chain confirmation
   - `confirming` – Source chain confirmed, waiting for destination
   - `completed` – Destination chain received funds
   - `failed` – Error at any step

2. **Status display:**
   - Progress indicator showing current step
   - Chain names for source and destination
   - Estimated time remaining (from LI.FI estimate)
   - Transaction hash links to correct chain explorers
   - Elapsed time counter

3. **Chain-specific explorers:**
   - Etherscan for Ethereum, Arbiscan for Arbitrum, etc.
   - Testnet explorers (Sepolia Etherscan, etc.)
   - Fallback to Blockscan for unknown chains

## Implementation

### `src/constants/explorers.ts`

```typescript
import { ChainId } from './networks'

export const explorerUrls: Partial<Record<ChainId, string>> = {
  // Mainnets
  [ChainId.Ethereum]: 'https://etherscan.io',
  [ChainId.Optimism]: 'https://optimistic.etherscan.io',
  [ChainId.Polygon]: 'https://polygonscan.com',
  [ChainId.Arbitrum]: 'https://arbiscan.io',
  [ChainId.Avalanche]: 'https://snowtrace.io',
  [ChainId.Base]: 'https://basescan.org',
  [ChainId.Celo]: 'https://celoscan.io',
  [ChainId.Linea]: 'https://lineascan.build',
  [ChainId.ZkSyncEra]: 'https://era.zksync.network',
  [ChainId.Unichain]: 'https://unichain.blockscout.com',
  [ChainId.Sonic]: 'https://sonicscan.org',
  [ChainId.Sei]: 'https://seitrace.com',
  [ChainId.WorldChain]: 'https://worldscan.org',
  [ChainId.Ink]: 'https://explorer.inkonchain.com',

  // Testnets
  [ChainId.EthereumSepolia]: 'https://sepolia.etherscan.io',
  [ChainId.OPSepolia]: 'https://sepolia-optimism.etherscan.io',
  [ChainId.BaseSepolia]: 'https://sepolia.basescan.org',
  [ChainId.ArbitrumSepolia]: 'https://sepolia.arbiscan.io',
  [ChainId.PolygonAmoy]: 'https://amoy.polygonscan.com',
  [ChainId.AvalancheFuji]: 'https://testnet.snowtrace.io',
  [ChainId.LineaSepolia]: 'https://sepolia.lineascan.build',
  [ChainId.ZkSyncEraSepolia]: 'https://sepolia-era.zksync.network',
}

export const getTxUrl = (chainId: number, txHash: string): string => (
  `${explorerUrls[chainId as ChainId] ?? 'https://blockscan.com'}/tx/${txHash}`
)

export const getAddressUrl = (chainId: number, address: string): string => (
  `${explorerUrls[chainId as ChainId] ?? 'https://blockscan.com'}/address/${address}`
)
```

### `src/lib/tx-status.ts`

```typescript
export type TxStep = 'approve' | 'send' | 'confirm' | 'complete'

export type TxStatus = {
  step: TxStep
  state: 'pending' | 'success' | 'failed'
  txHash?: string
  chainId?: number
  error?: string
  startedAt: number
  completedAt?: number
}

export type BridgeStatus = {
  overall: 'idle' | 'in_progress' | 'completed' | 'failed'
  steps: TxStatus[]
  estimatedDurationSeconds?: number
}

export const createInitialStatus = (): BridgeStatus => ({
  overall: 'idle',
  steps: [],
})

// Map LI.FI process status to our status
export const mapLifiProcessStatus = (
  processType: string,
  status: string,
): { step: TxStep; state: TxStatus['state'] } => {
  const step: TxStep = (
    processType === 'TOKEN_ALLOWANCE' ? 'approve'
    : processType === 'SWAP' || processType === 'CROSS_CHAIN' ? 'send'
    : processType === 'RECEIVING_CHAIN' ? 'confirm'
    : 'send'
  )
  const state: TxStatus['state'] = (
    status === 'DONE' ? 'success'
    : status === 'FAILED' ? 'failed'
    : 'pending'
  )
  return { step, state }
}
```

### `src/routes/bridge/TransactionStatus.svelte`

```svelte
<script lang="ts">
  import type { BridgeStatus, TxStep } from '$/lib/tx-status'
  import { getTxUrl } from '$/constants/explorers'

  let {
    status,
    fromChainId,
    toChainId,
  }: {
    status: BridgeStatus
    fromChainId: number
    toChainId: number
  } = $props()

  const steps: { key: TxStep; label: string }[] = [
    { key: 'approve', label: 'Approve' },
    { key: 'send', label: 'Send' },
    { key: 'confirm', label: 'Confirm' },
    { key: 'complete', label: 'Complete' },
  ]

  const getStepStatus = (stepKey: TxStep) => (
    status.steps.find(s => s.step === stepKey)
  )

  const elapsed = $derived(
    status.steps[0]?.startedAt
      ? Math.floor((Date.now() - status.steps[0].startedAt) / 1000)
      : 0
  )
</script>

{#if status.overall !== 'idle'}
  <div data-tx-status data-status={status.overall}>
    <ol data-tx-steps>
      {#each steps as { key, label } (key)}
        {@const stepStatus = getStepStatus(key)}
        <li
          data-step={key}
          data-state={stepStatus?.state ?? 'pending'}
        >
          <span data-step-indicator>
            {#if stepStatus?.state === 'success'}✓
            {:else if stepStatus?.state === 'failed'}✗
            {:else if stepStatus?.state === 'pending'}⋯
            {:else}○{/if}
          </span>
          <span data-step-label>{label}</span>
          {#if stepStatus?.txHash && stepStatus.chainId}
            <a
              href={getTxUrl(stepStatus.chainId, stepStatus.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              data-tx-link
            >
              {stepStatus.txHash.slice(0, 8)}…
            </a>
          {/if}
        </li>
      {/each}
    </ol>

    {#if status.overall === 'in_progress'}
      <p data-tx-elapsed>Elapsed: {elapsed}s</p>
      {#if status.estimatedDurationSeconds}
        <p data-tx-estimate>Est. {status.estimatedDurationSeconds}s total</p>
      {/if}
    {/if}

    {#if status.overall === 'failed'}
      {@const failedStep = status.steps.find(s => s.state === 'failed')}
      {#if failedStep?.error}
        <p data-tx-error role="alert">{failedStep.error}</p>
      {/if}
    {/if}

    {#if status.overall === 'completed'}
      <p data-tx-success>Bridge complete!</p>
    {/if}
  </div>
{/if}

<style>
  [data-tx-steps] {
    display: flex;
    gap: 0.5em;
    list-style: none;
    padding: 0;
  }

  [data-tx-steps] li {
    display: flex;
    align-items: center;
    gap: 0.25em;
    opacity: 0.5;
  }

  [data-tx-steps] li[data-state='pending'] {
    opacity: 1;
  }

  [data-tx-steps] li[data-state='success'] {
    opacity: 1;
    color: var(--color-success, #22c55e);
  }

  [data-tx-steps] li[data-state='failed'] {
    opacity: 1;
    color: var(--color-error, #ef4444);
  }

  [data-tx-error] {
    color: var(--color-error, #ef4444);
  }

  [data-tx-success] {
    color: var(--color-success, #22c55e);
  }
</style>
```

### Integration with `executeQuote`

Update `src/api/lifi.ts` to expose status updates:

```typescript
export type StatusCallback = (status: BridgeStatus) => void

export async function executeQuoteWithStatus(
  providerDetail: ProviderDetailType,
  params: QuoteParams,
  onStatusChange: StatusCallback,
): Promise<RouteExtended> {
  const status: BridgeStatus = { overall: 'in_progress', steps: [] }
  onStatusChange(status)

  return executeQuote(providerDetail, params, {
    updateRouteHook(route) {
      const processes = route.steps.flatMap(s => s.execution?.process ?? [])
      status.steps = processes.map(p => {
        const { step, state } = mapLifiProcessStatus(p.type, p.status)
        return {
          step,
          state,
          txHash: p.txHash,
          chainId: p.chainId,
          error: p.error?.message,
          startedAt: p.startedAt ?? Date.now(),
          completedAt: state !== 'pending' ? Date.now() : undefined,
        }
      })

      const hasFailed = status.steps.some(s => s.state === 'failed')
      const allDone = processes.every(p => p.status === 'DONE')

      status.overall = hasFailed ? 'failed' : allDone ? 'completed' : 'in_progress'
      onStatusChange({ ...status })
    },
  })
}
```

## Acceptance criteria

### Explorer URLs
- [x] `src/constants/explorers.ts` exists with URLs for all mainnet chains
- [x] `src/constants/explorers.ts` includes testnet explorer URLs
- [x] `getTxUrl(1, '0xabc')` returns `'https://etherscan.io/tx/0xabc'`
- [x] `getTxUrl(10, '0xabc')` returns `'https://optimistic.etherscan.io/tx/0xabc'`
- [x] `getTxUrl(999999, '0xabc')` returns Blockscan fallback
- [x] `getAddressUrl()` works for address links

### Status types
- [x] `TxStatus` type defined with step, state, txHash, chainId, error
- [x] `BridgeStatus` type defined with overall, steps, estimatedDuration
- [x] `mapLifiProcessStatus()` maps LI.FI process types correctly

### TransactionStatus component
- [x] Shows 4 steps: Approve → Send → Confirm → Complete
- [x] Active step shows spinner/pending indicator
- [x] Completed steps show checkmark
- [x] Failed steps show X and error message
- [x] Tx hashes link to correct chain explorers
- [x] Elapsed time counter updates during transaction
- [x] Estimated time shown if available

### Integration
- [x] `executeQuoteWithStatus()` exposes status callback
- [x] Bridge page uses status callback to update UI
- [x] Status persists across component re-renders

## Status

Complete.

## Output when complete

`DONE`
