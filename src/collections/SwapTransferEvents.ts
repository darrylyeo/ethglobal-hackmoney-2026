/**
 * Swap (DEX) transfer events per symbol+period. Populated when
 * TransferEvents fetches; views query this collection.
 */

import type { TransferEventRow } from '$/collections/TransferEvents.ts'
import type { CoinSymbol } from '$/constants/coins.ts'
import { CollectionId } from '$/constants/collections.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { isSwapTransfer } from '$/lib/transfer-classify.ts'

function getKey(row: TransferEventRow): string {
	const { $network, symbol, period, blockNumber, logIndex } = row.$id
	return `${symbol}:${period}:${$network.chainId}:${blockNumber}:${logIndex}`
}

export const swapTransferEventsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SwapTransferEvents,
		storageKey: CollectionId.SwapTransferEvents,
		getKey,
		parser: { stringify, parse },
	}),
)

const prefix = (symbol: string, period: string) => `${symbol}:${period}:`

export function upsertSwapTransferEvents(
	symbol: CoinSymbol,
	period: string,
	rows: TransferEventRow[],
): void {
	const pre = prefix(symbol, period)
	for (const key of swapTransferEventsCollection.state.keys()) {
		if (key.startsWith(pre)) swapTransferEventsCollection.delete(key)
	}
	for (const row of rows) {
		if (isSwapTransfer(row)) swapTransferEventsCollection.insert(row)
	}
}
