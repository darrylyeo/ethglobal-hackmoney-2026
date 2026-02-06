import type { ChainId } from '$/constants/networks.ts'

export type TokenListCoin$Id = {
	chainId: ChainId
	address: `0x${string}`
	interopAddress?: string,
}

export type TokenListCoin = {
	$id: TokenListCoin$Id
	chainId: ChainId
	address: `0x${string}`
	symbol: string
	name: string
	decimals: number
	logoURI?: string,
}
