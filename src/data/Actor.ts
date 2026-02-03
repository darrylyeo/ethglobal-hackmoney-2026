import type { ChainId } from '$/constants/networks'

export type Actor$Id = { network: ChainId; address: `0x${string}` }

export type Actor = {
	$id: Actor$Id
	chainId: ChainId
	address: `0x${string}`
}
