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

### Transaction status in `src/routes/bridge/BridgeExecution.svelte`

Transaction execution and status tracking is handled by `BridgeExecution.svelte`
which:

- Uses `createOptimisticAction` from TanStack DB
- Calls `executeSelectedRoute` from `$/api/lifi`
- Receives status updates via `onStatusChange` callback
- Inserts transaction into `transactionsCollection` on first tx hash
- Updates transaction status on completion/failure
- Shows toast notifications via `toasts` from `$/lib/toast.svelte`

Status is tracked via `BridgeStatus` type:
- `overall`: 'idle' | 'in_progress' | 'completed' | 'failed'
- `steps`: Array of `TxStatus` with step, state, txHash, chainId, error

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

### BridgeExecution component
- [x] Executes bridge via `executeSelectedRoute`
- [x] Receives status updates via callback
- [x] Tracks steps with state (pending/success/failed)
- [x] Inserts transaction on first tx hash
- [x] Updates transaction status on completion/failure
- [x] Shows toast notifications for success/error

### Integration
- [x] `executeQuoteWithStatus()` exposes status callback
- [x] Bridge page uses status callback to update UI
- [x] Status persists across component re-renders

## Status

Complete. Re-verification 2026-02-06 (PROMPT_build execute one spec, re-verify): re-verified 008; all AC—explorers.ts from networkConfigs, getTxUrl/getAddressUrl (explorers.spec.ts), TxStatus/BridgeStatus/mapLifiProcessStatus (tx-status.ts + tx-status.spec.ts), BridgeExecution executeSelectedRoute/onStatus/insertTransaction/updateTransaction/toasts/getTxUrl, lifi StatusCallback/executeSelectedRoute; test:unit 44 Deno + 101 Vitest passed. Previous: Re-verification 2026-02-05 (PROMPT_build execute one spec, no incomplete specs): re-verified 008; explorers.ts from networkConfigs (mainnet + testnet), getTxUrl(1|10|999999)/getAddressUrl, TxStatus/BridgeStatus/mapLifiProcessStatus in tx-status.ts + tx-status.spec.ts, BridgeExecution executeSelectedRoute/onStatus/insertTransaction/updateTransaction/toasts/getTxUrl links, lifi StatusCallback. test:unit 44 Deno + 101 Vitest passed. Previous: `src/constants/explorers.ts` with explorer URLs and getTxUrl/getAddressUrl.
`src/lib/tx-status.ts` with TxStatus, BridgeStatus types and mapLifiProcessStatus.
`src/routes/bridge/BridgeExecution.svelte` handles execution with status tracking
and transaction persistence via TanStack DB. Toast notifications for success/error.
Re-verification 2026-02-05 (PROMPT_build): all acceptance criteria confirmed; explorers from networkConfigs; executeQuoteWithStatus/executeSelectedRoute with StatusCallback; BridgeExecution insert/update transaction and toasts; test:unit 41 Deno + 101 Vitest passed. Re-verification 2026-02-05 (PROMPT_build execute one spec): all AC re-verified (explorers.ts from networkConfigs, getTxUrl/getAddressUrl, TxStatus/BridgeStatus/mapLifiProcessStatus, BridgeExecution executeSelectedRoute/callback/insert/update/toasts, lifi StatusCallback); test:unit 41 Deno + 101 Vitest passed.

## Output when complete

`DONE`
