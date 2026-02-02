export const sharedAddressKey = (
	roomId: string,
	peerId: string,
	address: `0x${string}`,
) => `${roomId}:${peerId}:${address.toLowerCase()}`
