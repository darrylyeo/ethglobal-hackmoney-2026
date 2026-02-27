/**
 * SIWE challenges collection: per-peer sign-in challenges for address verification.
 */

import { CollectionId } from '$/constants/collections.ts'
import { type WithSource } from '$/constants/data-sources.ts'
import type { SiweChallenge } from '$/data/SiweChallenge.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export const siweChallengesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SiweChallenges,
		getKey: (row: WithSource<SiweChallenge>) => row.id,
	}),
)
