import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	getTransactions,
	saveTransaction,
	updateTransactionStatus,
	type StoredTransaction,
} from './tx-history'

const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`

const makeTx = (overrides: Partial<StoredTransaction> = {}): StoredTransaction => ({
	id: 'tx-1',
	address: testAddress,
	fromChainId: 1,
	toChainId: 10,
	fromAmount: '1000000',
	toAmount: '999000',
	sourceTxHash: '0xabc',
	status: 'pending',
	createdAt: Date.now(),
	updatedAt: Date.now(),
	...overrides,
})

describe('tx-history', () => {
	let store: Record<string, string>

	beforeEach(() => {
		store = {}
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => store[key] ?? null,
			setItem: (key: string, value: string) => {
				store[key] = value
			},
			removeItem: (key: string) => {
				delete store[key]
			},
			length: 0,
			clear: () => {
				store = {}
			},
			key: () => null,
		})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('getTransactions returns empty array when no data', () => {
		expect(getTransactions(testAddress)).toEqual([])
	})

	it('saveTransaction persists to localStorage', () => {
		const tx = makeTx()
		saveTransaction(tx)
		const key = `bridge-tx-history-${testAddress.toLowerCase()}`
		expect(store[key]).toBeDefined()
		const parsed = JSON.parse(store[key]) as StoredTransaction[]
		expect(parsed).toHaveLength(1)
		expect(parsed[0].id).toBe(tx.id)
		expect(parsed[0].sourceTxHash).toBe('0xabc')
	})

	it('getTransactions returns transactions for address', () => {
		const tx = makeTx()
		saveTransaction(tx)
		const list = getTransactions(testAddress)
		expect(list).toHaveLength(1)
		expect(list[0].id).toBe(tx.id)
		expect(list[0].fromChainId).toBe(1)
		expect(list[0].toChainId).toBe(10)
	})

	it('transactions sorted by date (newest first) after save', () => {
		saveTransaction(makeTx({ id: 'a', createdAt: 1000, updatedAt: 1000 }))
		saveTransaction(makeTx({ id: 'b', createdAt: 2000, updatedAt: 2000 }))
		const list = getTransactions(testAddress)
		expect(list).toHaveLength(2)
		expect(list[0].id).toBe('b')
		expect(list[1].id).toBe('a')
	})

	it('updateTransactionStatus updates status and destTxHash', () => {
		saveTransaction(makeTx({ id: 'tx-1' }))
		updateTransactionStatus(testAddress, 'tx-1', 'completed', '0xdest')
		const list = getTransactions(testAddress)
		expect(list[0].status).toBe('completed')
		expect(list[0].destTxHash).toBe('0xdest')
	})

	it('maximum 50 transactions stored per address', () => {
		for (let i = 0; i < 55; i++) {
			saveTransaction(makeTx({ id: `tx-${i}` }))
		}
		const list = getTransactions(testAddress)
		expect(list).toHaveLength(50)
	})
})
