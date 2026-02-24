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

/** Normalize address to lowercase for consistent cache keys. */
const getKey = (row: VerifiedContractSourceRow) =>
	`${row.$id.$network.chainId}:${row.$id.address.toLowerCase()}`

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
	const key = `${chainId}:${address.toLowerCase()}` as unknown as Parameters<
		typeof verifiedContractSourcesCollection.state.get
	>[0]

	const existing = verifiedContractSourcesCollection.state.get(key)
	if (existing) {
		verifiedContractSourcesCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	}

	try {
		const entry = await fetchVerifiedContract(chainId, address)
		const $id = { $network: { chainId }, address }
		if (entry == null) {
			const row: VerifiedContractSourceRow = {
				$id,
				files: {},
				$source: DataSource.Sourcify,
				notFound: true,
				isLoading: false,
				error: null,
			}
			if (existing) {
				verifiedContractSourcesCollection.update(key, (draft) => {
					Object.assign(draft, row)
				})
			} else {
				verifiedContractSourcesCollection.insert(row)
			}
			return null
		}
		const row: VerifiedContractSourceRow = {
			...entry,
			$source: DataSource.Sourcify,
			notFound: false,
			isLoading: false,
			error: null,
		}
		if (existing) {
			verifiedContractSourcesCollection.update(key, (draft) => {
				Object.assign(draft, row)
			})
		} else {
			verifiedContractSourcesCollection.insert(row)
		}
		return entry
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		if (existing)
			verifiedContractSourcesCollection.update(key, (draft) => {
				draft.isLoading = false
				draft.error = message
			})
		throw e
	}
}
