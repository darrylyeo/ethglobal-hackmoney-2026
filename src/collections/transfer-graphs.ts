/**
 * Transfer graphs collection: graph result per period from Voltaire (eth_getLogs).
 * Manually fetched data is normalized into this collection; UI reads from it.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import {
	fetchTransfersGraphFromVoltaire,
	TIME_PERIODS,
	type TransferGraph,
	type TransfersGraphResult,
} from '$/api/transfers-indexer'

export type TransferGraphRow = {
	$id: { period: string }
	graph: TransferGraph
	period: string
	periods: typeof TIME_PERIODS
	$source: DataSource
	isLoading: boolean
	error: string | null
}

export const transferGraphsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'transfer-graphs',
		getKey: (row: TransferGraphRow) => row.$id.period,
	}),
)

const normalizeResult = (r: TransfersGraphResult): Omit<TransferGraphRow, 'isLoading' | 'error'> => ({
	$id: { period: r.period },
	graph: r.graph,
	period: r.period,
	periods: r.periods,
	$source: DataSource.Voltaire,
})

export const fetchTransferGraph = async (period: string) => {
	const key = period
	const existing = transferGraphsCollection.state.get(key)

	if (existing) {
		transferGraphsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = true
			draft.error = null
		})
	} else {
		transferGraphsCollection.insert({
			$id: { period },
			graph: { nodes: [], edges: [] },
			period,
			periods: TIME_PERIODS,
			$source: DataSource.Voltaire,
			isLoading: true,
			error: null,
		})
	}

	try {
		const result = await fetchTransfersGraphFromVoltaire(period)
		const normalized = normalizeResult(result)
		transferGraphsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.graph = normalized.graph
			draft.period = normalized.period
			draft.periods = normalized.periods
			draft.isLoading = false
			draft.error = null
		})
		return result
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		transferGraphsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = false
			draft.error = message
		})
		throw e
	}
}

export const getTransferGraph = (period: string) =>
	transferGraphsCollection.state.get(period)
