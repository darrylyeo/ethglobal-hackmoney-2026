/**
 * SIWE challenges collection: per-peer sign-in challenges for address verification.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { SiweChallenge } from '$/data/SiweChallenge'

export type SiweChallengeRow = SiweChallenge & { $source: DataSource }

export const siweChallengesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'siwe-challenges',
		getKey: (row: SiweChallengeRow) => row.id,
	}),
)

export { siweChallengeKey } from './siwe-challenges-keys'
