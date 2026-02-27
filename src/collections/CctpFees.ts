import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { CctpFee, CctpFee$Id, CctpFeeItem } from '$/data/CctpFee.ts'
import { stringify } from 'devalue'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

const toCctpFeeItem = (value: unknown): CctpFeeItem | null => {
	if (!isRecord(value)) return null
	const { finalityThreshold, minimumFee } = value
	if (typeof finalityThreshold !== 'number') return null
	if (typeof minimumFee !== 'number') return null
	return { finalityThreshold, minimumFee }
}

export const cctpFeesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.CctpFees,
		getKey: (fee: WithSource<CctpFee>) => stringify(fee.$id),
	}),
)

export const fetchCctpFees = async ($id: CctpFee$Id): Promise<WithSource<CctpFee>> => {
	const key = stringify($id)
	if (cctpFeesCollection.state.get(key)) {
		cctpFeesCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		cctpFeesCollection.insert({
			$id,
			$source: DataSourceId.Cctp,
			rows: [],
			fetchedAt: 0,
			isLoading: true,
			error: null,
		})
	}

	try {
		const response = await fetch(
			`${$id.apiHost}/v2/burn/USDC/fees/${$id.fromDomain}/${$id.toDomain}`,
			{ headers: { Accept: 'application/json' } },
		)
		if (!response.ok)
			throw new Error(`Fee request failed (${response.status})`)
		const data = await response.json()
		const rows = (
			Array.isArray(data) ?
				data
					.map(toCctpFeeItem)
					.filter((fee): fee is CctpFeeItem => fee !== null)
			:
				[]
		)
		cctpFeesCollection.update(key, (draft) => {
			draft.rows = rows
			draft.fetchedAt = Date.now()
			draft.isLoading = false
			draft.error = null
		})
		return cctpFeesCollection.state.get(key)!
	} catch (error) {
		cctpFeesCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = error instanceof Error ? error.message : String(error)
		})
		return cctpFeesCollection.state.get(key)!
	}
}
