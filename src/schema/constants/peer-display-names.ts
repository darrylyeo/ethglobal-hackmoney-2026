import type { PeerAdjective, PeerAnimal } from '$/constants/peer-display-names'

export type PeerAdjectiveEntry = {
	adjective: PeerAdjective
	label: string
}

export type PeerAnimalEntry = {
	animal: PeerAnimal
}

export type PeerAnimalEmojiEntry = {
	animal: PeerAnimal
	emoji: string
}
