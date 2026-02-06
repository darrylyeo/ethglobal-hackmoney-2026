/**
 * SIWE challenges collection: per-peer sign-in challenges for address verification.
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { SiweChallenge } from '$/data/SiweChallenge.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type SiweChallengeRow = SiweChallenge & { $source: DataSource }

export const siweChallengesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'siwe-challenges',
		getKey: (row: SiweChallengeRow) => row.id,
	}),
)

export { siweChallengeKey } from './siwe-challenges-keys.ts'
