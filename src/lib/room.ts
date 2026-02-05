/**
 * PartyKit client: connect to room, create room, send messages.
 */

import PartySocket from 'partysocket'
import {
	adjectives as peerAdjectives,
	nouns as peerNouns,
} from '$/constants/peer-display-names'
import {
	adjectives as roomAdjectives,
	nouns as roomNouns,
} from '$/constants/room-display-names'

export type RoomMessage =
	| { type: 'join'; displayName?: string }
	| { type: 'leave' }
	| { type: 'share-address'; address: `0x${string}`; targetPeerIds?: string[] | null }
	| { type: 'request-challenge'; address: `0x${string}`; fromPeerId: string }
	| { type: 'challenge'; challenge: unknown }
	| { type: 'submit-signature'; challengeId: string; signature: `0x${string}` }
	| { type: 'verify-result'; challengeId: string; verified: boolean }
	| { type: 'verification-record'; verification: import('$/data/Verification').Verification }
	| { type: 'mark-unverifiable'; challengeId: string }
	| { type: 'sync'; state: unknown }
	| {
			type: 'propose-transfer'
			to: `0x${string}`
			allocations: { asset: string; amount: string }[]
	  }
	| {
			type: 'transfer-request'
			from: `0x${string}`
			request: {
				id: string
				roomId: string
				from: `0x${string}`
				to: `0x${string}`
				allocations: { asset: string; amount: string }[]
				status: string
				createdAt: number
				expiresAt: number
			}
	  }
	| { type: 'accept-transfer'; requestId: string }
	| { type: 'reject-transfer'; requestId: string; reason?: string }
	| { type: 'transfer-sent'; requestId: string }

const envHost =
	typeof import.meta.env !== 'undefined'
		? (import.meta.env as { PUBLIC_PARTYKIT_HOST?: string })
				.PUBLIC_PARTYKIT_HOST
		: undefined
const browserHost =
	typeof globalThis !== 'undefined' &&
	'location' in globalThis &&
	typeof globalThis.location === 'object' &&
	globalThis.location
		? globalThis.location.hostname
		: undefined
const PARTYKIT_HOST =
	envHost ?? (browserHost ? `${browserHost}:1999` : 'localhost:1999')

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

// Room ID encoding: hex string <-> human-readable "Adjective Noun" pairs
// Each pair encodes `adjectives.length * nouns.length` values (~2352 with current lists)

const ROOM_PAIR_BASE = BigInt(roomAdjectives.length * roomNouns.length)
const ROOM_ID_BYTES = 4
const ROOM_ID_MIN_PAIRS = 2

export const generateRoomId = () => {
	const bytes = crypto.getRandomValues(new Uint8Array(ROOM_ID_BYTES))
	return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const roomIdToDisplayName = (roomId: string) => {
	const value = BigInt(`0x${roomId}`)
	const pairs: string[] = []
	let remaining = value

	do {
		const pairIndex = Number(remaining % ROOM_PAIR_BASE)
		const adjIndex = Math.floor(pairIndex / roomNouns.length)
		const nounIndex = pairIndex % roomNouns.length
		pairs.push(
			`${roomAdjectives[adjIndex].adjective} ${roomNouns[nounIndex].noun}`,
		)
		remaining = remaining / ROOM_PAIR_BASE
	} while (remaining > 0n)

	while (pairs.length < ROOM_ID_MIN_PAIRS)
		pairs.push(`${roomAdjectives[0].adjective} ${roomNouns[0].noun}`)

	return pairs.reverse().join(' ')
}

const roomAdjectiveIndex = new Map(
	roomAdjectives.map((entry, index) => [entry.adjective.toLowerCase(), index]),
)
const roomNounIndex = new Map(
	roomNouns.map((entry, index) => [entry.noun.toLowerCase(), index]),
)

export const displayNameToRoomId = (displayName: string) => {
	const words = displayName.trim().toLowerCase().split(/\s+/).filter(Boolean)
	if (words.length === 0 || words.length % 2 !== 0) return null

	const pairs: number[] = []
	for (let i = 0; i < words.length; i += 2) {
		const adjIdx = roomAdjectiveIndex.get(words[i])
		const nounIdx = roomNounIndex.get(words[i + 1])
		if (adjIdx === undefined || nounIdx === undefined) return null
		pairs.push(adjIdx * roomNouns.length + nounIdx)
	}

	let value = 0n
	for (const pairIndex of pairs) {
		value = value * ROOM_PAIR_BASE + BigInt(pairIndex)
	}

	return value.toString(16).padStart(ROOM_ID_BYTES * 2, '0')
}

export const normalizeRoomInput = (input: string) => {
	const trimmed = input.trim()
	if (/^[0-9a-f]+$/i.test(trimmed)) return trimmed.toLowerCase()
	return displayNameToRoomId(trimmed)
}

export const generatePeerDisplayName = (): string =>
	`${peerAdjectives[Math.floor(Math.random() * peerAdjectives.length)].adjective} ${peerNouns[Math.floor(Math.random() * peerNouns.length)].noun}`

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

export const peerNameToHue = (name: string): number => simpleHash(name) % 360

export const peerNameToEmoji = (
	displayName: string | undefined,
	fallbackId: string,
): string => {
	const peerNounsByName = new Map(
		peerNouns.map((entry) => [entry.noun, entry.icon]),
	)
	const peerNounIcons = [...new Set(peerNouns.map((entry) => entry.icon))]

	if (displayName) {
		const parts = displayName.trim().split(/\s+/)
		const animal = parts[parts.length - 1]
		const emoji = peerNounsByName.get(animal)
		if (emoji) return emoji
	}
	return peerNounIcons[simpleHash(fallbackId) % peerNounIcons.length]
}

export const createRoom = (_name?: string): Promise<string> =>
	Promise.resolve(generateRoomId())
