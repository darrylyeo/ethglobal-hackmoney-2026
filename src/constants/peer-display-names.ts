/**
 * Peer display name word lists and animal→emoji mapping for room avatars.
 */

import type {
	PeerAdjectiveEntry,
	PeerAnimalEmojiEntry,
	PeerAnimalEntry,
} from '$/schema/constants/peer-display-names'

export enum PeerAdjective {
	Swift = 'Swift',
	Bold = 'Bold',
	Calm = 'Calm',
	Clever = 'Clever',
	Cosmic = 'Cosmic',
	Crimson = 'Crimson',
	Daring = 'Daring',
	Eager = 'Eager',
	Frosty = 'Frosty',
	Gentle = 'Gentle',
	Golden = 'Golden',
	Hasty = 'Hasty',
	Jolly = 'Jolly',
	Lucky = 'Lucky',
	Misty = 'Misty',
	Noble = 'Noble',
	Quick = 'Quick',
	Silent = 'Silent',
	Solar = 'Solar',
	Velvet = 'Velvet',
}

export const peerAdjectives = [
	{ adjective: PeerAdjective.Swift, label: 'Swift' },
	{ adjective: PeerAdjective.Bold, label: 'Bold' },
	{ adjective: PeerAdjective.Calm, label: 'Calm' },
	{ adjective: PeerAdjective.Clever, label: 'Clever' },
	{ adjective: PeerAdjective.Cosmic, label: 'Cosmic' },
	{ adjective: PeerAdjective.Crimson, label: 'Crimson' },
	{ adjective: PeerAdjective.Daring, label: 'Daring' },
	{ adjective: PeerAdjective.Eager, label: 'Eager' },
	{ adjective: PeerAdjective.Frosty, label: 'Frosty' },
	{ adjective: PeerAdjective.Gentle, label: 'Gentle' },
	{ adjective: PeerAdjective.Golden, label: 'Golden' },
	{ adjective: PeerAdjective.Hasty, label: 'Hasty' },
	{ adjective: PeerAdjective.Jolly, label: 'Jolly' },
	{ adjective: PeerAdjective.Lucky, label: 'Lucky' },
	{ adjective: PeerAdjective.Misty, label: 'Misty' },
	{ adjective: PeerAdjective.Noble, label: 'Noble' },
	{ adjective: PeerAdjective.Quick, label: 'Quick' },
	{ adjective: PeerAdjective.Silent, label: 'Silent' },
	{ adjective: PeerAdjective.Solar, label: 'Solar' },
	{ adjective: PeerAdjective.Velvet, label: 'Velvet' },
] as const satisfies readonly PeerAdjectiveEntry[]

export const PEER_ADJECTIVES = peerAdjectives.map((entry) => entry.label)

export enum PeerAnimal {
	Bear = 'Bear',
	Cat = 'Cat',
	Crow = 'Crow',
	Deer = 'Deer',
	Dog = 'Dog',
	Dolphin = 'Dolphin',
	Eagle = 'Eagle',
	Fox = 'Fox',
	Hawk = 'Hawk',
	Lion = 'Lion',
	Otter = 'Otter',
	Owl = 'Owl',
	Panda = 'Panda',
	Rabbit = 'Rabbit',
	Raven = 'Raven',
	Salmon = 'Salmon',
	Seal = 'Seal',
	Tiger = 'Tiger',
	Wolf = 'Wolf',
	Wren = 'Wren',
}

export const peerAnimals = [
	{ animal: PeerAnimal.Bear },
	{ animal: PeerAnimal.Cat },
	{ animal: PeerAnimal.Crow },
	{ animal: PeerAnimal.Deer },
	{ animal: PeerAnimal.Dog },
	{ animal: PeerAnimal.Dolphin },
	{ animal: PeerAnimal.Eagle },
	{ animal: PeerAnimal.Fox },
	{ animal: PeerAnimal.Hawk },
	{ animal: PeerAnimal.Lion },
	{ animal: PeerAnimal.Otter },
	{ animal: PeerAnimal.Owl },
	{ animal: PeerAnimal.Panda },
	{ animal: PeerAnimal.Rabbit },
	{ animal: PeerAnimal.Raven },
	{ animal: PeerAnimal.Salmon },
	{ animal: PeerAnimal.Seal },
	{ animal: PeerAnimal.Tiger },
	{ animal: PeerAnimal.Wolf },
	{ animal: PeerAnimal.Wren },
] as const satisfies readonly PeerAnimalEntry[]

export const peerAnimalEmojis = [
	{ animal: PeerAnimal.Bear, emoji: '🐻' },
	{ animal: PeerAnimal.Cat, emoji: '🐱' },
	{ animal: PeerAnimal.Crow, emoji: '🐦‍⬛' },
	{ animal: PeerAnimal.Deer, emoji: '🦌' },
	{ animal: PeerAnimal.Dog, emoji: '🐕' },
	{ animal: PeerAnimal.Dolphin, emoji: '🐬' },
	{ animal: PeerAnimal.Eagle, emoji: '🦅' },
	{ animal: PeerAnimal.Fox, emoji: '🦊' },
	{ animal: PeerAnimal.Hawk, emoji: '🦅' },
	{ animal: PeerAnimal.Lion, emoji: '🦁' },
	{ animal: PeerAnimal.Otter, emoji: '🦦' },
	{ animal: PeerAnimal.Owl, emoji: '🦉' },
	{ animal: PeerAnimal.Panda, emoji: '🐼' },
	{ animal: PeerAnimal.Rabbit, emoji: '🐰' },
	{ animal: PeerAnimal.Raven, emoji: '🐦‍⬛' },
	{ animal: PeerAnimal.Salmon, emoji: '🐟' },
	{ animal: PeerAnimal.Seal, emoji: '🦭' },
	{ animal: PeerAnimal.Tiger, emoji: '🐯' },
	{ animal: PeerAnimal.Wolf, emoji: '🐺' },
	{ animal: PeerAnimal.Wren, emoji: '🐦' },
] as const satisfies readonly PeerAnimalEmojiEntry[]

export const PEER_ANIMALS = peerAnimals.map((entry) => entry.animal)

export const PEER_ANIMAL_EMOJI = Object.fromEntries(
	peerAnimalEmojis.map((entry) => [entry.animal, entry.emoji]),
)

export const PEER_ANIMAL_EMOJI_LIST = [
	...new Set(peerAnimalEmojis.map((entry) => entry.emoji)),
]
