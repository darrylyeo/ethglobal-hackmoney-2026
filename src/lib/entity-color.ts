import { coinById } from '$/constants/coins.ts'
import {
	COIN_ENTITY_TYPES,
	getCoinIdForCoinEntity,
} from '$/lib/coin-entity.ts'
import type { IntentEntityRef } from '$/constants/intents.ts'
import { type ChainId, networksByChainId } from '$/constants/networks.ts'
import { EntityType } from '$/data/$EntityType.ts'

export const getEntityColor = (entity: IntentEntityRef) => {
	const { type, id } = entity
	if (type === EntityType.Network || type === EntityType.ActorNetwork) {
		const chainId =
			typeof id === 'number'
				? (id as ChainId)
				: (id.chainId ?? id.network) as ChainId | undefined
		return chainId != null ? networksByChainId[chainId]?.color : undefined
	}
	const coinId = COIN_ENTITY_TYPES.has(type)
		? getCoinIdForCoinEntity(type, id)
		: undefined
	return coinId != null ? coinById[coinId]?.color : undefined
}
