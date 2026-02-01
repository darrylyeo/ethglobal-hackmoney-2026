/**
 * Peer display name word lists and animal→emoji mapping for room avatars.
 */

export const PEER_ADJECTIVES = [
	'Swift', 'Bold', 'Calm', 'Clever', 'Cosmic', 'Crimson', 'Daring', 'Eager', 'Frosty', 'Gentle',
	'Golden', 'Hasty', 'Jolly', 'Lucky', 'Misty', 'Noble', 'Quick', 'Silent', 'Solar', 'Velvet',
] as const

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

export const PEER_ANIMALS: readonly PeerAnimal[] = Object.values(PeerAnimal)

export const PEER_ANIMAL_EMOJI: Record<PeerAnimal, string> = {
	[PeerAnimal.Bear]: '🐻',
	[PeerAnimal.Cat]: '🐱',
	[PeerAnimal.Crow]: '🐦‍⬛',
	[PeerAnimal.Deer]: '🦌',
	[PeerAnimal.Dog]: '🐕',
	[PeerAnimal.Dolphin]: '🐬',
	[PeerAnimal.Eagle]: '🦅',
	[PeerAnimal.Fox]: '🦊',
	[PeerAnimal.Hawk]: '🦅',
	[PeerAnimal.Lion]: '🦁',
	[PeerAnimal.Otter]: '🦦',
	[PeerAnimal.Owl]: '🦉',
	[PeerAnimal.Panda]: '🐼',
	[PeerAnimal.Rabbit]: '🐰',
	[PeerAnimal.Raven]: '🐦‍⬛',
	[PeerAnimal.Salmon]: '🐟',
	[PeerAnimal.Seal]: '🦭',
	[PeerAnimal.Tiger]: '🐯',
	[PeerAnimal.Wolf]: '🐺',
	[PeerAnimal.Wren]: '🐦',
}

export const PEER_ANIMAL_EMOJI_LIST = [...new Set(Object.values(PEER_ANIMAL_EMOJI))]
