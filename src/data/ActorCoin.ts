export type ActorCoin$Id = {
	chainId: number
	address: `0x${string}`
	tokenAddress: `0x${string}`
}

export type ActorCoin = {
	$id: ActorCoin$Id
	symbol: string
	decimals: number
	balance: bigint
	isLoading: boolean
	error: string | null
}

export type ActorCoinToken = {
	chainId: number
	address: `0x${string}`
	symbol: string
	decimals: number
}
