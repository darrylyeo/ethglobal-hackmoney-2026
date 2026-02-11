export type PeerAdjectiveEntry = {
	adjective: string
}

export type PeerAnimalEntry = {
	animal: string
}

export type PeerAnimalEmojiEntry = {
	animal: string
	emoji: string
}

export const adjectives = [
	{ adjective: 'Bold' },
	{ adjective: 'Brave' },
	{ adjective: 'Calm' },
	{ adjective: 'Clever' },
	{ adjective: 'Curious' },
	{ adjective: 'Daring' },
	{ adjective: 'Eager' },
	{ adjective: 'Fierce' },
	{ adjective: 'Gentle' },
	{ adjective: 'Hasty' },
	{ adjective: 'Hidden' },
	{ adjective: 'Jolly' },
	{ adjective: 'Kind' },
	{ adjective: 'Loyal' },
	{ adjective: 'Lucky' },
	{ adjective: 'Mellow' },
	{ adjective: 'Nimble' },
	{ adjective: 'Noble' },
	{ adjective: 'Playful' },
	{ adjective: 'Proud' },
	{ adjective: 'Quick' },
	{ adjective: 'Quiet' },
	{ adjective: 'Shy' },
	{ adjective: 'Silent' },
	{ adjective: 'Sly' },
	{ adjective: 'Strong' },
	{ adjective: 'Swift' },
	{ adjective: 'Wary' },
	{ adjective: 'Wild' },
	{ adjective: 'Wise' },
] as const

export const adjectivesByIndex = Object.fromEntries(
	adjectives.map((entry, index) => [index, entry]),
)

export const nouns = [
	{ noun: 'Bat', icon: '🦇' },
	{ noun: 'Bear', icon: '🐻' },
	{ noun: 'Bee', icon: '🐝' },
	{ noun: 'Butterfly', icon: '🦋' },
	{ noun: 'Cat', icon: '🐱' },
	{ noun: 'Chicken', icon: '🐓' },
	{ noun: 'Cow', icon: '🐄' },
	{ noun: 'Deer', icon: '🦌' },
	{ noun: 'Dodo', icon: '🦤' },
	{ noun: 'Dog', icon: '🐕' },
	{ noun: 'Dolphin', icon: '🐬' },
	{ noun: 'Duck', icon: '🦆' },
	{ noun: 'Eagle', icon: '🦅' },
	{ noun: 'Fish', icon: '🐟' },
	{ noun: 'Flamingo', icon: '🦩' },
	{ noun: 'Fox', icon: '🦊' },
	{ noun: 'Frog', icon: '🐸' },
	{ noun: 'Goat', icon: '🐐' },
	{ noun: 'Hedgehog', icon: '🦔' },
	{ noun: 'Horse', icon: '🐴' },
	{ noun: 'Lion', icon: '🦁' },
	{ noun: 'Mouse', icon: '🐭' },
	{ noun: 'Otter', icon: '🦦' },
	{ noun: 'Owl', icon: '🦉' },
	{ noun: 'Panda', icon: '🐼' },
	{ noun: 'Penguin', icon: '🐧' },
	{ noun: 'Pig', icon: '🐷' },
	{ noun: 'Rabbit', icon: '🐰' },
	{ noun: 'Robin', icon: '🐦' },
	{ noun: 'Seal', icon: '🦭' },
	{ noun: 'Sheep', icon: '🐑' },
	{ noun: 'Snake', icon: '🐍' },
	{ noun: 'Swan', icon: '🦢' },
	{ noun: 'Tiger', icon: '🐯' },
	{ noun: 'Turkey', icon: '🦃' },
	{ noun: 'Turtle', icon: '🐢' },
	{ noun: 'Whale', icon: '🐋' },
	{ noun: 'Wolf', icon: '🐺' },
] as const

export const nounsByIndex = Object.fromEntries(
	nouns.map((entry, index) => [index, entry]),
)
