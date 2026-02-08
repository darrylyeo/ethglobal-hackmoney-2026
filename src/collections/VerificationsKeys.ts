export const verificationKey = (
	roomId: string,
	verifierPeerId: string,
	verifiedPeerId: string,
	address: `0x${string}`,
	requestedAt: number,
) =>
	`${roomId}:${verifierPeerId}:${verifiedPeerId}:${address.toLowerCase()}:${requestedAt}`
