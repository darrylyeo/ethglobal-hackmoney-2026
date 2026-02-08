/**
 * SIWE challenges collection: per-peer sign-in challenges for address verification.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { SiweChallenge } from '$/data/SiweChallenge.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type SiweChallengeRow = SiweChallenge & { $source: DataSource }

export const siweChallengesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SiweChallenges,
		getKey: (row: SiweChallengeRow) => row.id,
	}),
)

export { siweChallengeKey } from './SiweChallengesKeys.ts'
