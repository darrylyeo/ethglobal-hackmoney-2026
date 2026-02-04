import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type { CctpFee, CctpFee$Id, CctpFeeItem } from '$/data/CctpFee'

export type CctpFeeRow = CctpFee & { $source: DataSource }

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
		id: 'cctp-fees',
		getKey: (row: CctpFeeRow) => stringify(row.$id),
	}),
)

export const fetchCctpFees = async ($id: CctpFee$Id): Promise<CctpFeeRow> => {
	const key = stringify($id)
	const existing = cctpFeesCollection.state.get(key)
	if (existing) {
		cctpFeesCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		cctpFeesCollection.insert({
			$id,
			$source: DataSource.Cctp,
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
		if (!response.ok) throw new Error(`Fee request failed (${response.status})`)
		const data = await response.json()
		const rows = Array.isArray(data)
			? data
					.map(toCctpFeeItem)
					.filter((row): row is CctpFeeItem => row !== null)
			: []
		const fetchedAt = Date.now()
		cctpFeesCollection.update(key, (draft) => {
			draft.rows = rows
			draft.fetchedAt = fetchedAt
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
