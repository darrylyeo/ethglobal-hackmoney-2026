/**
 * Channel proposals: room-scoped proposals to open payment channels (in-memory, synced via PartyKit).
 */

import { createCollection, localOnlyCollectionOptions } from '@tanstack/svelte-db'

export type ChannelProposalStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'opened'

export type ChannelProposal = {
	id: string
	roomId: string
	from: `0x${string}`
	to: `0x${string}`
	chainId: number
	fromDeposit: bigint
	toDeposit: bigint
	status: ChannelProposalStatus
	createdAt: number
	expiresAt: number
}

export const channelProposalsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'channel-proposals',
		getKey: (row: ChannelProposal) => row.id,
	}),
)
