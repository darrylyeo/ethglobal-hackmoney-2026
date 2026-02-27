import type { DataSourceId } from '$/constants/data-sources.ts'
import type { Network$Id } from '$/data/Network.ts'

export type EvmActorProfile$Id = {
	$network: Network$Id
	address: `0x${string}`
}

export type EvmActorProfile = {
	$id: EvmActorProfile$Id
	primaryName?: string
	avatarUrl?: string
	$source: DataSourceId
}
