import type { ChainId } from '$/constants/networks.ts'
import type { Actor$Id } from '$/data/Actor.ts'
import type { Coin$Id } from '$/data/Coin.ts'

export type ActorCoin$Id = {
	$actor: Actor$Id
	$coin: Coin$Id
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

