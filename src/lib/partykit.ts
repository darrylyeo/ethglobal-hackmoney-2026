/**
 * PartyKit client: connect to room, create room, send messages.
 */

import PartySocket from 'partysocket'

export type RoomMessage =
	| { type: 'join'; displayName?: string }
	| { type: 'leave' }
	| { type: 'share-address'; address: `0x${string}` }
	| { type: 'request-challenge'; address: `0x${string}`; fromPeerId: string }
	| { type: 'challenge'; challenge: unknown }
	| { type: 'submit-signature'; challengeId: string; signature: `0x${string}` }
	| { type: 'verify-result'; challengeId: string; verified: boolean }
	| { type: 'sync'; state: unknown }

const PARTYKIT_HOST =
	(typeof import.meta.env !== 'undefined' && (import.meta.env as { PUBLIC_PARTYKIT_HOST?: string }).PUBLIC_PARTYKIT_HOST)
		?? (typeof window !== 'undefined' ? `${window.location.hostname}:1999` : 'localhost:1999')

export type RoomConnection = {
	socket: PartySocket
	roomId: string
	peerId: string
	send: (msg: RoomMessage) => void
	close: () => void
}

export const connectToRoom = (roomId: string): RoomConnection => {
	const socket = new PartySocket({
		host: PARTYKIT_HOST,
		room: roomId,
	})
	return {
		socket,
		roomId,
		peerId: socket.id ?? '',
		send: (msg) => socket.send(JSON.stringify(msg)),
		close: () => socket.close(),
	}
}

export const generateRoomCode = () => (
	Math.random().toString(36).substring(2, 8).toUpperCase()
)

export const createRoom = async (_name?: string): Promise<string> => {
	return generateRoomCode()
}
