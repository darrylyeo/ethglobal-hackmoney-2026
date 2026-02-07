# Spec 011: Transaction history

Persist and display past bridge transactions for the connected wallet.

## Requirements

1. **Transaction storage:**
   - Store completed transactions in localStorage
   - Key by wallet address
   - Include: chains, amounts, tx hashes, timestamps, status

2. **History display:**
   - Collapsible section below the bridge form
   - Most recent transactions first
   - Show: date, from→to chains, amount, status, explorer links

3. **Status refresh:**
   - For pending transactions, poll status
   - Update when completed or failed

## Implementation

### `src/lib/tx-history.ts`

```typescript
export type StoredTransaction = {
  id: string
  address: `0x${string}`
  fromChainId: number
  toChainId: number
  fromAmount: string
  toAmount: string
  sourceTxHash: string
  destTxHash?: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'bridge-tx-history'

export const saveTransaction = (tx: StoredTransaction) => {
  const existing = getTransactions(tx.address)
  const updated = [tx, ...existing.filter(t => t.id !== tx.id)].slice(0, 50)
  localStorage.setItem(`${STORAGE_KEY}-${tx.address}`, JSON.stringify(updated))
}

export const getTransactions = (address: `0x${string}`): StoredTransaction[] => {
  const raw = localStorage.getItem(`${STORAGE_KEY}-${address}`)
  return raw ? JSON.parse(raw) : []
}

export const updateTransactionStatus = (
  address: `0x${string}`,
  id: string,
  status: StoredTransaction['status'],
  destTxHash?: string,
) => {
  const txs = getTransactions(address)
  const tx = txs.find(t => t.id === id)
  if (tx) {
    tx.status = status
    tx.destTxHash = destTxHash ?? tx.destTxHash
    tx.updatedAt = Date.now()
    saveTransaction(tx)
  }
}
```

### Transaction history in `src/routes/bridge/lifi/BridgeFlow.svelte`

Transaction history is displayed inline using `transactionsCollection` via
TanStack DB:

```svelte
<!-- Transaction history -->
{#if transactions.length > 0}
  <section data-card data-column="gap-2">
    <h3>Recent Transactions</h3>
    <div data-column="gap-1">
      {#each transactions as tx (tx.$id.sourceTxHash)}
        <div data-row="gap-2 align-center" data-tx-row>
          <span>{networksByChainId[tx.fromChainId]?.name} → {networksByChainId[tx.toChainId]?.name}</span>
          <span data-tabular>{formatSmallestToDecimal(tx.fromAmount, 6)} USDC</span>
          <span data-tag={tx.status}>{tx.status}</span>
          <a href={getTxUrl(tx.fromChainId, tx.$id.sourceTxHash)} target="_blank" rel="noopener">↗</a>
        </div>
      {/each}
    </div>
  </section>
{/if}
```

### Integration

- `BridgeExecution.svelte` inserts transaction via `insertTransaction` on first tx hash
- Updates status via `updateTransaction` on completion/failure
- Transactions filtered by `selectedActor` address

## Acceptance criteria

- [x] `saveTransaction()` persists to localStorage
- [x] `getTransactions()` returns transactions for address
- [x] Transaction history displays inline in BridgeFlow.svelte
- [x] Transactions sorted by date (newest first)
- [x] Each row shows: date, from→to chains, amount, status
- [x] Explorer links work for source and destination chains
- [x] Pending transactions show spinner and poll for updates
- [x] Maximum 50 transactions stored per address

## Status

Complete. Re-verification 2026-02-07 (PROMPT_build execute one spec, re-verify 011): all 8 AC confirmed—txHistory.ts saveTransaction/getTransactions/updateTransactionStatus (localStorage, max 50); txHistory.spec.ts covers persist, get by address, sort newest first, updateStatus, max 50; transactionsCollection + insertTransaction/updateTransaction in $/collections/transactions.ts; BridgeExecution.svelte inserts on first tx hash, updates on completion/failure; BridgeFlow.svelte txQuery orderBy createdAt desc, transactions filtered by selectedActor and slice(0, 50), section "Transaction history" with date (formatRelativeTime), from→to chains, amount, status, spinner for pending, explorer links source + dest; $effect polls pending via getTxReceiptStatus every 5s. test:unit 44 Deno + 159 Vitest passed. Previous: Transaction storage uses `transactionsCollection` via TanStack DB. `insertTransaction` and `updateTransaction` in `$/collections/transactions`. BridgeExecution.svelte inserts on first tx hash, updates on completion. BridgeFlow.svelte displays transactions inline filtered by `selectedActor`. Unit tests in tx-history.spec.ts.

## Output when complete

`DONE`
