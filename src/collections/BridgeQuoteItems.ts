/**
 * LiFi bridge quote cache for session Action. Stores transactionRequest from getQuote.
 */

import { getQuoteStepWithTransaction } from '$/api/lifi.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type {
	BridgeQuoteItem,
	BridgeQuoteTransactionRequest,
} from '$/data/BridgeQuoteItem.ts'
import type { BridgeRoutes$Id } from '$/data/BridgeRoute.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify } from 'devalue'

export type BridgeQuoteItemRow = BridgeQuoteItem & { $source: DataSource }

function stepToTransactionRequests(
	step: {
		transactionRequest?: { to?: string; data?: string; value?: string; gasLimit?: string }
		action?: { fromChainId?: number }
		includedSteps?: Array<{
			transactionRequest?: { to?: string; data?: string; value?: string; gasLimit?: string }
			action?: { fromChainId?: number }
		}>
	},
): BridgeQuoteTransactionRequest[] {
	const out: BridgeQuoteTransactionRequest[] = []
	const add = (tx: { to: string; data: string; value?: string; gasLimit?: string }, chainId: number, label: string) => {
		if (tx?.to && tx?.data)
			out.push({ to: tx.to as `0x${string}`, data: tx.data as `0x${string}`, value: tx.value, chainId, gasLimit: tx.gasLimit, label })
	}
	const tx = step.transactionRequest
	if (tx?.to && tx?.data) {
		add(tx, step.action?.fromChainId ?? 1, 'Deposit / Send')
		return out
	}
	for (let i = 0; i < (step.includedSteps?.length ?? 0); i++) {
		const inc = step.includedSteps![i]
		const incTx = inc.transactionRequest
		if (incTx?.to && incTx?.data)
			add(incTx, inc.action?.fromChainId ?? step.action?.fromChainId ?? 1, i === 0 ? 'Deposit / Send' : 'Claim / Receive')
	}
	return out
}

export const bridgeQuoteItemsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.BridgeQuoteItems,
		getKey: (row: BridgeQuoteItemRow) => row.$id,
	}),
)

export const getBridgeQuoteRequestKey = ($id: BridgeRoutes$Id) =>
	stringify($id)

export const fetchBridgeQuote = async (
	$id: BridgeRoutes$Id,
): Promise<BridgeQuoteItem | null> => {
	const key = getBridgeQuoteRequestKey($id)
	const existing = bridgeQuoteItemsCollection.state.get(key)
	const item: BridgeQuoteItemRow = {
		$id: key,
		request: $id,
		success: false,
		transactionRequests: [],
		fetchedAt: Date.now(),
		error: null,
		$source: DataSource.LiFi,
	}
	if (existing) {
		bridgeQuoteItemsCollection.update(key, (draft) => {
			draft.fetchedAt = item.fetchedAt
			draft.error = null
		})
	}
	try {
		const step = await getQuoteStepWithTransaction({
			fromChain: $id.fromChainId,
			toChain: $id.toChainId,
			fromAmount: $id.amount.toString(),
			fromAddress: $id.fromAddress,
			slippage: $id.slippage ?? 0.005,
		})
		const txRequests = stepToTransactionRequests(step)
		item.success = txRequests.length > 0
		item.transactionRequests = txRequests
	} catch (e) {
		item.error = e instanceof Error ? e.message : String(e)
	}
	const finalKey = item.$id
	const existingRow = bridgeQuoteItemsCollection.state.get(finalKey)
	if (existingRow) {
		bridgeQuoteItemsCollection.update(finalKey, (draft) => {
			Object.assign(draft, item)
		})
	} else {
		bridgeQuoteItemsCollection.insert(item)
	}
	return item
}

export const getBridgeQuote = ($id: BridgeRoutes$Id) =>
	bridgeQuoteItemsCollection.state.get(getBridgeQuoteRequestKey($id))
