export const sharedAddressKey = (
	roomId: string,
	peerId: string,
	address: `0x${string}`,
	targetPeerIds: string[] | null,
) =>
	`${roomId}:${peerId}:${address.toLowerCase()}:${
		targetPeerIds === null ?
			'all'
		:
			targetPeerIds.join(',')
	}`
