/**
 * Verified contract sources from Sourcify.
 * Cached per chainId:address. Fetched on address page when viewing a contract.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { fetchVerifiedContract } from '$/api/sourcify.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { ChainId } from '$/constants/networks.ts'
import type {
	VerifiedContractSourceEntry,
	VerifiedContractSource$Id,
} from '$/data/VerifiedContractSource.ts'

const getKey = (row: VerifiedContractSourceRow) =>
	`${row.$id.$network.chainId}:${row.$id.address}`

export type VerifiedContractSourceRow = VerifiedContractSourceEntry & {
	$source: DataSource
	isLoading?: boolean
	notFound?: boolean
	error?: string | null
}

export const verifiedContractSourcesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.VerifiedContractSources,
		storageKey: CollectionId.VerifiedContractSources,
		getKey: (row: VerifiedContractSourceRow) => getKey(row),
		parser: { stringify, parse },
	}),
)

export async function fetchVerifiedContractSource(
	chainId: ChainId,
	address: `0x${string}`,
): Promise<VerifiedContractSourceEntry | null> {
	const key = `${chainId}:${address}` as unknown as Parameters<
		typeof verifiedContractSourcesCollection.state.get
	>[0]

	if (verifiedContractSourcesCollection.state.get(key)) {
		verifiedContractSourcesCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		verifiedContractSourcesCollection.insert({
			$id: {
				$network: { chainId },
				address,
			},
			files: {},
			$source: DataSource.Sourcify,
			isLoading: true,
			error: null,
		})
	}

	try {
		const entry = await fetchVerifiedContract(chainId, address)
		if (entry == null) {
			verifiedContractSourcesCollection.update(key, (draft) => {
				Object.assign(draft, {
					notFound: true,
					isLoading: false,
					error: null,
				})
			})
			return null
		}
		verifiedContractSourcesCollection.update(key, (draft) => {
			Object.assign(draft, {
				...entry,
				notFound: false,
				isLoading: false,
				error: null,
			})
		})
		return entry
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		verifiedContractSourcesCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = message
		})
		throw e
	}
}
