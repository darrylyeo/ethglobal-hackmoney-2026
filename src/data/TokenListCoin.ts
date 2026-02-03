export type TokenListCoin$Id = {
	chainId: number
	address: `0x${string}`
}

export type TokenListCoin = {
	$id: TokenListCoin$Id
	chainId: number
	address: `0x${string}`
	symbol: string
	name: string
	decimals: number
	logoURI?: string
}
