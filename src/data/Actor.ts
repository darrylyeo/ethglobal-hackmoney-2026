export type Actor$Id = { network: number; address: `0x${string}` }

export type Actor = {
	$id: Actor$Id
	chainId: number
	address: `0x${string}`
}
