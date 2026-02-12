import type { Network$Id } from '$/data/Network.ts'

export type TokenListCoin$Id = {
	$network: Network$Id
	address: `0x${string}`
	interopAddress?: string
}

export type TokenListCoin = {
	$id: TokenListCoin$Id
	symbol: string
	name: string
	decimals: number
	logoURI?: string
}
