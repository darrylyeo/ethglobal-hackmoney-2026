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

### `src/routes/bridge/TransactionHistory.svelte`

- Props: `address: \`0x${string}\``
- Loads transactions for address on mount
- Displays list with expandable details
- Each item shows: date, chains, amount, status badge, links

### Integration

- After successful bridge submission, call `saveTransaction()`
- Show `TransactionHistory` component in bridge page
- Poll pending transactions for status updates

## Acceptance criteria

- [ ] `saveTransaction()` persists to localStorage
- [ ] `getTransactions()` returns transactions for address
- [ ] `TransactionHistory.svelte` displays past transactions
- [ ] Transactions sorted by date (newest first)
- [ ] Each row shows: date, from→to chains, amount, status
- [ ] Explorer links work for source and destination chains
- [ ] Pending transactions show spinner and poll for updates
- [ ] Maximum 50 transactions stored per address

## Status

Not started.

## Output when complete

`DONE`
