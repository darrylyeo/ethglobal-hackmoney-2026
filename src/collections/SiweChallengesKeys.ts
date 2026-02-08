export const siweChallengeKey = (
	roomId: string,
	fromPeerId: string,
	toPeerId: string,
	address: `0x${string}`,
) =>
	`${roomId}:${fromPeerId}:${toPeerId}:${address.toLowerCase()}`
