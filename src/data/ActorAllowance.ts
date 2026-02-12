import type { Actor$Id } from '$/data/Actor.ts'
import type { ActorCoin$Id } from '$/data/ActorCoin.ts'

export type ActorAllowance$Id = {
	$actorCoin: ActorCoin$Id
	$spender: Actor$Id
	interopAddress?: string
}

export type ActorAllowance = {
	$id: ActorAllowance$Id
	allowance: bigint
	isLoading: boolean
	error: string | null
	lastChecked: number
}

