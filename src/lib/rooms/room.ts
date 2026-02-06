/**
 * PartyKit client: connect to room, create room, send messages.
 */

import PartySocket from 'partysocket'
import {
	adjectives as peerAdjectives,
	nouns as peerNouns,
} from '$/constants/peer-display-names.ts'
import {
	adjectives as roomAdjectives,
	colors as roomColors,
	nouns as roomNouns,
} from '$/constants/room-display-names.ts'

export type RoomMessage =
	| { type: 'join', displayName?: string }
	| { type: 'leave' }
	| {
			type: 'share-address'
			address: `0x${string}`
			targetPeerIds?: string[] | null,
	  }
	| { type: 'request-challenge', address: `0x${string}`, fromPeerId: string }
	| { type: 'challenge', challenge: unknown }
	| { type: 'submit-signature', challengeId: string, signature: `0x${string}` }
	| { type: 'verify-result', challengeId: string, verified: boolean }
	| {
			type: 'verification-record'
			verification: import('$/data/Verification.ts').Verification,
	  }
	| { type: 'mark-unverifiable', challengeId: string }
	| { type: 'sync', state: unknown }
	| {
			type: 'propose-transfer'
			to: `0x${string}`
			allocations: { asset: string, amount: string }[],
	  }
	| {
			type: 'transfer-request'
			from: `0x${string}`
			request: {
				id: string
				roomId: string
				from: `0x${string}`
				to: `0x${string}`
				allocations: { asset: string, amount: string }[]
				status: string
				createdAt: number
				expiresAt: number,
			},
	  }
	| { type: 'accept-transfer', requestId: string }
	| { type: 'reject-transfer', requestId: string, reason?: string }
	| { type: 'transfer-sent', requestId: string }

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

const PERSISTENT_PEER_ID_KEY = 'room-persistent-peer-id'

const getOrCreatePersistentPeerId = (): string => {
	if (typeof localStorage === 'undefined') return crypto.randomUUID()
	let id = localStorage.getItem(PERSISTENT_PEER_ID_KEY)
	if (!id) {
		id = crypto.randomUUID()
		localStorage.setItem(PERSISTENT_PEER_ID_KEY, id)
	}
	return id
}

export type RoomConnection = {
	socket: PartySocket
	roomId: string
	peerId: string
	send: (msg: RoomMessage) => void
	close: () => void,
}

export const connectToRoom = (roomId: string): RoomConnection => {
	const peerId = getOrCreatePersistentPeerId()
	const socket = new PartySocket({
		host: PARTYKIT_HOST,
		room: roomId,
		id: peerId,
	})
	return {
		socket,
		roomId,
		peerId: socket.id ?? peerId,
		send: (msg) => socket.send(JSON.stringify(msg)),
		close: () => socket.close(),
	}
}

// Room ID encoding: hex string <-> human-readable "Adjective Color Place" triplets
const ROOM_TRIPLET_BASE = BigInt(
	roomColors.length * roomAdjectives.length * roomNouns.length,
)
const ROOM_TRIPLET_BASE_N = roomColors.length * roomAdjectives.length * roomNouns.length
const ROOM_ID_MIN_TRIPLETS = 1
const ADJ_NOUN_BASE = roomAdjectives.length * roomNouns.length

export const generateRoomId = () => {
	const bytes = crypto.getRandomValues(new Uint8Array(3))
	const n = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2]
	const value = n % ROOM_TRIPLET_BASE_N
	return value.toString(16).padStart(6, '0')
}

export const roomIdToDisplayName = (roomId: string) => {
	const value = BigInt(`0x${roomId}`)
	const triplets: string[] = []
	let remaining = value

	do {
		const tripletIndex = Number(remaining % ROOM_TRIPLET_BASE)
		const colorIndex = Math.floor(tripletIndex / ADJ_NOUN_BASE)
		const pairRem = tripletIndex % ADJ_NOUN_BASE
		const adjIndex = Math.floor(pairRem / roomNouns.length)
		const nounIndex = pairRem % roomNouns.length
		triplets.push(
			`${roomAdjectives[adjIndex].adjective} ${roomColors[colorIndex].color} ${roomNouns[nounIndex].noun}`,
		)
		remaining = remaining / ROOM_TRIPLET_BASE
	} while (remaining > 0n)

	while (triplets.length < ROOM_ID_MIN_TRIPLETS)
		triplets.push(
			`${roomAdjectives[0].adjective} ${roomColors[0].color} ${roomNouns[0].noun}`,
		)

	return triplets.reverse().join(' ')
}

export const roomIdToPlaceEmoji = (roomId: string): string => {
	const value = BigInt(`0x${roomId}`)
	let remaining = value
	let lastIcon = roomNouns[0].icon
	do {
		const tripletIndex = Number(remaining % ROOM_TRIPLET_BASE)
		const pairRem = tripletIndex % ADJ_NOUN_BASE
		const nounIndex = pairRem % roomNouns.length
		lastIcon = roomNouns[nounIndex].icon
		remaining = remaining / ROOM_TRIPLET_BASE
	} while (remaining > 0n)
	return lastIcon
}

const roomColorIndex = new Map(
	roomColors.map((entry, index) => [entry.color.toLowerCase(), index]),
)
const roomAdjectiveIndex = new Map(
	roomAdjectives.map((entry, index) => [entry.adjective.toLowerCase(), index]),
)
const roomNounIndex = new Map(
	roomNouns.map((entry, index) => [entry.noun.toLowerCase(), index]),
)

export const displayNameToRoomId = (displayName: string) => {
	const words = displayName.trim().toLowerCase().split(/\s+/).filter(Boolean)
	if (words.length === 0 || words.length % 3 !== 0) return null

	const triplets: number[] = []
	for (let i = 0; i < words.length; i += 3) {
		const adjIdx = roomAdjectiveIndex.get(words[i])
		const colorIdx = roomColorIndex.get(words[i + 1])
		const nounIdx = roomNounIndex.get(words[i + 2])
		if (
			colorIdx === undefined ||
			adjIdx === undefined ||
			nounIdx === undefined
		)
			return null
		triplets.push(
			colorIdx * ADJ_NOUN_BASE + adjIdx * roomNouns.length + nounIdx,
		)
	}

	let value = 0n
	for (const tripletIndex of triplets) {
		value = value * ROOM_TRIPLET_BASE + BigInt(tripletIndex)
	}

	return value.toString(16).padStart(6, '0')
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
