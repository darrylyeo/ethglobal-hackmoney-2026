/**
 * Bridge (CCTP etc.) transfer events per symbol+period. Populated when
 * TransferEvents fetches; views query this collection.
 */

import type { TransferEventRow } from '$/collections/TransferEvents.ts'
import type { CoinId } from '$/constants/coins.ts'
import { CollectionId } from '$/constants/collections.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { isBridgeTransfer } from '$/lib/transfer-classify.ts'

function getKey(row: TransferEventRow): string {
	const { $network, symbol, period, blockNumber, logIndex } = row.$id
	return `${symbol}:${period}:${$network.chainId}:${blockNumber}:${logIndex}`
}

export const bridgeTransferEventsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.BridgeTransferEvents,
		storageKey: CollectionId.BridgeTransferEvents,
		getKey,
		parser: { stringify, parse },
	}),
)

const prefix = (symbol: string, period: string) => `${symbol}:${period}:`

export function upsertBridgeTransferEvents(
	coinId: CoinId,
	period: string,
	rows: TransferEventRow[],
): void {
	const pre = prefix(coinId, period)
	for (const key of bridgeTransferEventsCollection.state.keys()) {
		if (key.startsWith(pre)) bridgeTransferEventsCollection.delete(key)
	}
	for (const row of rows) {
		if (isBridgeTransfer(row)) bridgeTransferEventsCollection.insert(row)
	}
}
