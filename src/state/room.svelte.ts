/**
 * Room state: PartyKit connection, join/leave, sync from server to collections.
 */

import { channelProposalsCollection } from '$/collections/channel-proposals'
import { roomsCollection } from '$/collections/rooms'
import { roomPeersCollection } from '$/collections/room-peers'
import { sharedAddressesCollection } from '$/collections/shared-addresses'
import { siweChallengesCollection } from '$/collections/siwe-challenges'
import {
	connectToRoom,
	type RoomConnection,
	type RoomMessage,
} from '$/lib/partykit'
import { verifySiweSignature } from '$/lib/siwe'
import type { ChannelProposal } from '$/collections/channel-proposals'
import type { Room } from '$/collections/rooms'
import type { RoomPeer } from '$/collections/room-peers'
import type { SharedAddress } from '$/collections/shared-addresses'
import type { SiweChallenge } from '$/collections/siwe-challenges'

const SIWE_DEBUG = typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV

type RoomStateSync = {
	room: Room
	peers: RoomPeer[]
	sharedAddresses: SharedAddress[]
	challenges: SiweChallenge[]
}

function upsert<T extends object>(
	col: { state: Map<string, T>; insert: (row: T) => void; update: (key: string, fn: (draft: T) => void) => void },
	row: T,
	getKey: (row: T) => string,
) {
	const key = getKey(row)
	const existing = col.state.get(key)
	if (existing) {
		col.update(key, (draft) => {
			Object.assign(draft, row)
		})
	} else {
		col.insert(row)
	}
}

function syncStateToCollections(roomId: string, state: RoomStateSync) {
	const peerIds = new Set(state.peers.map((p) => `${roomId}:${p.peerId}`))
	const sharedIds = new Set(state.sharedAddresses.map((s) => s.id))
	const challengeIds = new Set(state.challenges.map((c) => c.id))

	upsert(roomsCollection, state.room, (r) => r.id)
	for (const p of state.peers) {
		upsert(roomPeersCollection, p, (r) => r.id)
	}
	for (const [key, row] of roomPeersCollection.state) {
		if (row.roomId === roomId && !peerIds.has(key)) roomPeersCollection.delete(key)
	}
	for (const s of state.sharedAddresses) {
		upsert(sharedAddressesCollection, s, (r) => r.id)
	}
	for (const [key, row] of sharedAddressesCollection.state) {
		if (row.roomId === roomId && !sharedIds.has(row.id)) sharedAddressesCollection.delete(key)
	}
	for (const c of state.challenges) {
		upsert(siweChallengesCollection, c, (r) => r.id)
	}
	for (const [key, row] of siweChallengesCollection.state) {
		if (row.roomId === roomId && !challengeIds.has(row.id)) siweChallengesCollection.delete(key)
	}
}

function handleServerMessage(msg: RoomMessage) {
	switch (msg.type) {
		case 'sync':
			syncStateToCollections((msg.state as RoomStateSync).room.id, msg.state as RoomStateSync)
			break
		case 'challenge': {
			const ch = msg.challenge as SiweChallenge
			if (SIWE_DEBUG) {
				console.debug('[SIWE] challenge received', { id: ch.id, from: ch.fromPeerId, to: ch.toPeerId, address: ch.address })
			}
			upsert(siweChallengesCollection, ch, (r) => r.id)
			break
		}
		case 'verify-result': {
			if (SIWE_DEBUG) console.debug('[SIWE] verify-result received', { challengeId: msg.challengeId, verified: msg.verified })
			const existing = siweChallengesCollection.state.get(msg.challengeId)
			if (existing) {
				siweChallengesCollection.update(msg.challengeId, (draft) => {
					draft.verified = msg.verified
				})
			}
			break
		}
		case 'submit-signature': {
			const ch = siweChallengesCollection.state.get(msg.challengeId)
			const amVerifier = ch?.toPeerId === roomState.peerId
			if (SIWE_DEBUG) {
				console.debug('[SIWE] submit-signature received', { challengeId: msg.challengeId, amVerifier, myPeerId: roomState.peerId })
			}
			if (ch && amVerifier) {
				verifySiweSignature({
					message: ch.message,
					signature: msg.signature,
					expectedAddress: ch.address,
				}).then((verified) => {
					if (SIWE_DEBUG) console.debug('[SIWE] sending verify-result', { challengeId: msg.challengeId, verified })
					roomState.connection?.send({
						type: 'verify-result',
						challengeId: msg.challengeId,
						verified,
					})
				})
			}
			break
		}
		case 'channel-proposal': {
			const p = msg.channelParams
			const row: ChannelProposal = {
				id: p.id,
				roomId: p.roomId,
				from: p.from,
				to: p.to,
				chainId: p.chainId,
				fromDeposit: BigInt(p.fromDeposit ?? '0'),
				toDeposit: BigInt(p.toDeposit ?? '0'),
				status: 'pending',
				createdAt: p.createdAt,
				expiresAt: p.expiresAt,
			}
			upsert(channelProposalsCollection, row, (r) => r.id)
			break
		}
		case 'accept-channel': {
			const existing = channelProposalsCollection.state.get(msg.proposalId)
			if (existing) {
				channelProposalsCollection.update(msg.proposalId, (draft) => {
					draft.status = 'accepted'
				})
			}
			break
		}
		case 'reject-channel': {
			const existing = channelProposalsCollection.state.get(msg.proposalId)
			if (existing) {
				channelProposalsCollection.update(msg.proposalId, (draft) => {
					draft.status = 'rejected'
				})
			}
			break
		}
		case 'channel-opened': {
			const [a, b] = msg.participants
			const lower = (x: string) => x.toLowerCase()
			for (const [id, row] of channelProposalsCollection.state) {
				if (row.status === 'accepted' && (
					(lower(row.from) === lower(a) && lower(row.to) === lower(b)) ||
					(lower(row.from) === lower(b) && lower(row.to) === lower(a))
				)) {
					channelProposalsCollection.update(id, (draft) => {
						draft.status = 'opened'
					})
					break
				}
			}
			break
		}
		default:
			break
	}
}

export type RoomState = {
	connection: RoomConnection | null
	roomId: string | null
	peerId: string | null
}

export const roomState = $state<RoomState>({
	connection: null,
	roomId: null,
	peerId: null,
})

export const joinRoom = (roomId: string, displayName?: string) => {
	const conn = connectToRoom(roomId)
	conn.socket.addEventListener('message', (event: MessageEvent) => {
		const data = typeof event.data === 'string' ? event.data : ''
		try {
			const msg = JSON.parse(data) as RoomMessage
			handleServerMessage(msg)
		} catch {
			// ignore non-JSON
		}
	})
	conn.send({ type: 'join', displayName })
	roomState.connection = conn
	roomState.roomId = roomId
	roomState.peerId = conn.peerId
}

export const leaveRoom = () => {
	roomState.connection?.send({ type: 'leave' })
	roomState.connection?.close()
	roomState.connection = null
	roomState.roomId = null
	roomState.peerId = null
}
