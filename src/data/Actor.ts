import type { Network$Id } from '$/data/Network.ts'

export type Actor$Id = {
	$network: Network$Id
	address: `0x${string}`
	interopAddress?: string
}

export type Actor = {
	$id: Actor$Id
}
