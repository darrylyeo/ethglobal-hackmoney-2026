/**
 * EIP/ERC proposals. Persisted to localStorage; synced from GitHub API on demand.
 */

import { CollectionId } from '$/constants/collections.ts'
import type { ProposalEntry } from '$/data/ProposalEntry.ts'
import { fetchProposalEntries } from '$/api/eips.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export const proposalsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Proposals,
		storageKey: CollectionId.Proposals,
		getKey: (row: ProposalEntry) => String(row.number),
		parser: { stringify, parse },
	}),
)

/** Fetch from API and upsert into collection. Call when proposals are needed (e.g. proposals page). */
export async function ensureProposalsSync(): Promise<void> {
	const entries = await fetchProposalEntries()
	for (const row of entries) {
		const key = String(row.number)
		if (proposalsCollection.state.get(key)) {
			proposalsCollection.update(key, (draft) => {
				Object.assign(draft, row)
			})
		} else {
			proposalsCollection.insert(row)
		}
	}
}
