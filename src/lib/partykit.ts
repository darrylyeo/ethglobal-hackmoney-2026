/**
 * PartyKit client: connect to room, create room, send messages.
 */

import PartySocket from 'partysocket'
import {
	PEER_ADJECTIVES,
	PEER_ANIMALS,
	PEER_ANIMAL_EMOJI,
	PEER_ANIMAL_EMOJI_LIST,
} from '$/constants/peer-display-names'

export type RoomMessage =
	| { type: 'join'; displayName?: string }
	| { type: 'leave' }
	| { type: 'share-address'; address: `0x${string}` }
	| { type: 'request-challenge'; address: `0x${string}`; fromPeerId: string }
	| { type: 'challenge'; challenge: unknown }
	| { type: 'submit-signature'; challengeId: string; signature: `0x${string}` }
	| { type: 'verify-result'; challengeId: string; verified: boolean }
	| { type: 'sync'; state: unknown }
	| { type: 'propose-channel'; to: `0x${string}`; myDeposit: string; theirDeposit: string }
	| { type: 'channel-proposal'; from: `0x${string}`; channelParams: { id: string; roomId: string; from: `0x${string}`; to: `0x${string}`; chainId: number; fromDeposit: string; toDeposit: string; status: string; createdAt: number; expiresAt: number } }
	| { type: 'accept-channel'; proposalId: string }
	| { type: 'reject-channel'; proposalId: string; reason?: string }
	| { type: 'channel-opened'; channelId: string; participants: [`0x${string}`, `0x${string}`] }
	| { type: 'channel-closed'; channelId: string }

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

export const generatePeerDisplayName = (): string => (
	`${PEER_ADJECTIVES[Math.floor(Math.random() * PEER_ADJECTIVES.length)]} ${PEER_ANIMALS[Math.floor(Math.random() * PEER_ANIMALS.length)]}`
)

const PEER_DISPLAY_NAME_KEY = 'room-peer-display-name'

export const getOrCreatePeerDisplayName = (): string => {
	if (typeof sessionStorage === 'undefined') return generatePeerDisplayName()
	let name = sessionStorage.getItem(PEER_DISPLAY_NAME_KEY)
	if (!name) {
		name = generatePeerDisplayName()
		sessionStorage.setItem(PEER_DISPLAY_NAME_KEY, name)
	}
	return name
}

const simpleHash = (s: string): number => {
	let h = 0
	for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
	return Math.abs(h)
}

export const peerNameToHue = (name: string): number => (simpleHash(name) % 360)

export const peerNameToEmoji = (displayName: string | undefined, fallbackId: string): string => {
	if (displayName) {
		const parts = displayName.trim().split(/\s+/)
		const animal = parts[parts.length - 1]
		if (animal && animal in PEER_ANIMAL_EMOJI) return PEER_ANIMAL_EMOJI[animal as keyof typeof PEER_ANIMAL_EMOJI]
	}
	return PEER_ANIMAL_EMOJI_LIST[simpleHash(fallbackId) % PEER_ANIMAL_EMOJI_LIST.length]
}

export const createRoom = async (_name?: string): Promise<string> => {
	return generateRoomCode()
}
