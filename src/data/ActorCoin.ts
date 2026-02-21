import type { Erc20Coin$Id } from '$/constants/coin-instances.ts'
import type { Contract$Id } from '$/data/Contract.ts'
import type { Actor$Id } from '$/data/Actor.ts'

export type ActorCoin$Id = {
	$actor: Actor$Id
	$coin: Erc20Coin$Id
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
	contract: Contract$Id
	symbol: string
	decimals: number
}

