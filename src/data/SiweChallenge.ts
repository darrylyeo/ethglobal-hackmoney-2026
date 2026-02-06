export type SiweChallenge = {
	id: string
	roomId: string
	fromPeerId: string
	toPeerId: string
	address: `0x${string}`
	message: string
	nonce: string
	issuedAt: number
	expiresAt: number
	signature?: `0x${string}`
	verified: boolean,
}
