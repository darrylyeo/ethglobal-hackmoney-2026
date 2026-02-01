/**
 * Room state: PartyKit connection, join/leave, sync from server to collections.
 */

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
import type { Room } from '$/collections/rooms'
import type { RoomPeer } from '$/collections/room-peers'
import type { SharedAddress } from '$/collections/shared-addresses'
import type { SiweChallenge } from '$/collections/siwe-challenges'

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
	for (const [key, row] of roomPeersCollection.state) {
		if (row.roomId === roomId) roomPeersCollection.delete(key)
	}
	for (const [key, row] of sharedAddressesCollection.state) {
		if (row.roomId === roomId) sharedAddressesCollection.delete(key)
	}
	for (const [key, row] of siweChallengesCollection.state) {
		if (row.roomId === roomId) siweChallengesCollection.delete(key)
	}

	upsert(roomsCollection, state.room, (r) => r.id)
	for (const p of state.peers) {
		upsert(roomPeersCollection, p, (r) => r.id)
	}
	for (const s of state.sharedAddresses) {
		upsert(sharedAddressesCollection, s, (r) => r.id)
	}
	for (const c of state.challenges) {
		upsert(siweChallengesCollection, c, (r) => r.id)
	}
}

function handleServerMessage(msg: RoomMessage) {
	switch (msg.type) {
		case 'sync':
			syncStateToCollections((msg.state as RoomStateSync).room.id, msg.state as RoomStateSync)
			break
		case 'challenge': {
			const ch = msg.challenge as SiweChallenge
			upsert(siweChallengesCollection, ch, (r) => r.id)
			break
		}
		case 'verify-result': {
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
			if (ch && ch.toPeerId === roomState.peerId) {
				verifySiweSignature({
					message: ch.message,
					signature: msg.signature,
					expectedAddress: ch.address,
				}).then((verified) => {
					roomState.connection?.send({
						type: 'verify-result',
						challengeId: msg.challengeId,
						verified,
					})
				})
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
