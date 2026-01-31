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
	const updated = [tx, ...existing.filter((t) => t.id !== tx.id)].slice(0, 50)
	localStorage.setItem(`${STORAGE_KEY}-${tx.address.toLowerCase()}`, JSON.stringify(updated))
}

export const getTransactions = (address: `0x${string}`): StoredTransaction[] => {
	const raw = localStorage.getItem(`${STORAGE_KEY}-${address.toLowerCase()}`)
	return raw ? (JSON.parse(raw) as StoredTransaction[]) : []
}

export const updateTransactionStatus = (
	address: `0x${string}`,
	id: string,
	status: StoredTransaction['status'],
	destTxHash?: string,
) => {
	const txs = getTransactions(address)
	const tx = txs.find((t) => t.id === id)
	if (tx) {
		tx.status = status
		tx.destTxHash = destTxHash ?? tx.destTxHash
		tx.updatedAt = Date.now()
		saveTransaction(tx)
	}
}
