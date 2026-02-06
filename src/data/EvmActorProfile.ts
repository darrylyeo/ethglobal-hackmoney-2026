import type { DataSource } from '$/constants/data-sources.ts'
import type { ChainId } from '$/constants/networks.ts'

export type EvmActorProfile$Id = {
	chainId: ChainId
	address: `0x${string}`
}

export type EvmActorProfile = {
	$id: EvmActorProfile$Id
	primaryName?: string
	avatarUrl?: string
	$source: DataSource
}
