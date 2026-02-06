import type { ChainId } from '$/constants/networks.ts'

export type Actor$Id = {
	network: ChainId
	address: `0x${string}`
	interopAddress?: string
}

export type Actor = {
	$id: Actor$Id
	chainId: ChainId
	address: `0x${string}`
}
