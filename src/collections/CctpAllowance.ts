import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { CctpAllowance, CctpAllowance$Id } from '$/data/CctpAllowance.ts'
import { stringify } from 'devalue'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

export const cctpAllowanceCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.CctpAllowance,
		getKey: (row: WithSource<CctpAllowance>) => stringify(row.$id),
	}),
)

export const fetchCctpAllowance = async (
	$id: CctpAllowance$Id,
): Promise<WithSource<CctpAllowance>> => {
	const key = stringify($id)
	if (cctpAllowanceCollection.state.get(key)) {
		cctpAllowanceCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		cctpAllowanceCollection.insert({
			$id,
			$source: DataSourceId.Cctp,
			allowance: null,
			lastUpdated: null,
			fetchedAt: 0,
			isLoading: true,
			error: null,
		})
	}

	try {
		const response = await fetch(`${$id.apiHost}/v2/fastBurn/USDC/allowance`, {
			headers: { Accept: 'application/json' },
		})
		if (!response.ok)
			throw new Error(`Allowance request failed (${response.status})`)
		const data = await response.json()
		const allowance =
			isRecord(data) && typeof data.allowance === 'number'
				? data.allowance
				: null
		const lastUpdated =
			isRecord(data) && typeof data.lastUpdated === 'string'
				? data.lastUpdated
				: null
		const fetchedAt = Date.now()
		cctpAllowanceCollection.update(key, (draft) => {
			draft.allowance = allowance
			draft.lastUpdated = lastUpdated
			draft.fetchedAt = fetchedAt
			draft.isLoading = false
			draft.error = null
		})
		return cctpAllowanceCollection.state.get(key)!
	} catch (error) {
		cctpAllowanceCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = error instanceof Error ? error.message : String(error)
		})
		return cctpAllowanceCollection.state.get(key)!
	}
}
