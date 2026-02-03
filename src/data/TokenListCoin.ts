import type { ChainId } from '$/constants/networks'

export type TokenListCoin$Id = {
	chainId: ChainId
	address: `0x${string}`
}

export type TokenListCoin = {
	$id: TokenListCoin$Id
	chainId: ChainId
	address: `0x${string}`
	symbol: string
	name: string
	decimals: number
	logoURI?: string
}
