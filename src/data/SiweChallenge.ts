export type SiweChallenge = {
	id: string
	roomId: string
	fromPeerId: string
	toPeerId: string
	address: `0x${string}`
	message: string
	nonce: string
	/** Unix time in milliseconds (normalized at ingest). */
	issuedAt: number
	/** Unix time in milliseconds (normalized at ingest). */
	expiresAt: number
	signature?: `0x${string}`
	verified: boolean,
}
