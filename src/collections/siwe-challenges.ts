/**
 * SIWE challenges collection: per-peer sign-in challenges for address verification.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type SiweChallenge = {
	id: string
	roomId: string
	fromPeerId: string
	toPeerId: string
	address: `0x${string}`
	message: string
	nonce: string
	issuedAt: number
	expiresAt: number
	signature?: `0x${string}`
	verified: boolean
}

export const siweChallengesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'siwe-challenges',
		getKey: (row: SiweChallenge) => row.id,
	}),
)

export { siweChallengeKey } from './siwe-challenges-keys'
