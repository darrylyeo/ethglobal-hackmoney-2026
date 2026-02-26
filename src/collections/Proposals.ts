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
		getKey: (proposal: ProposalEntry) => proposal.$id?.id ?? String(proposal.number),
		parser: { stringify, parse },
	}),
)

/** Fetch from API and upsert into collection. Call when proposals are needed (e.g. proposals page). */
export async function ensureProposalsSync(): Promise<void> {
	const entries = await fetchProposalEntries()
	for (const proposal of entries) {
		const key = proposal.$id?.id ?? String(proposal.number)
		if (proposalsCollection.state.get(key)) {
			proposalsCollection.update(key, (draft) => {
				Object.assign(draft, proposal)
			})
		} else {
			proposalsCollection.insert(proposal)
		}
	}
}
