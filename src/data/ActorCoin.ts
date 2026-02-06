import type { ChainId } from '$/constants/networks.ts'

export type ActorCoin$Id = {
	chainId: ChainId
	address: `0x${string}`
	tokenAddress: `0x${string}`
	interopAddress?: string
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
	chainId: ChainId
	address: `0x${string}`
	symbol: string
	decimals: number
}
