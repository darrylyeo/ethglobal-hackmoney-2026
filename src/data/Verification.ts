export enum VerificationStatus {
	Unverifiable = 'unverifiable',
	Verifying = 'verifying',
	Verified = 'verified',
}

export type Verification = {
	id: string
	roomId: string
	verifierPeerId: string
	verifiedPeerId: string
	address: `0x${string}`
	status: VerificationStatus
	/** Unix time in milliseconds (normalized at ingest). */
	requestedAt: number
	/** Unix time in milliseconds (normalized at ingest). */
	verifiedAt?: number
	signature?: `0x${string}`
	challengeId?: string,
}

