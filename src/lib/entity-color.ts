import { coinColorBySymbol } from '$/constants/coins.ts'
import { type ChainId, networksByChainId } from '$/constants/networks.ts'
import type { IntentEntityRef } from '$/constants/intents.ts'
import { EntityType } from '$/data/$EntityType.ts'
import { getSymbolForCoinEntity, isCoinEntityType } from '$/lib/coin-icon.ts'

export const getEntityColor = (entity: IntentEntityRef) => {
	const { type, id } = entity
	if (type === EntityType.Network || type === EntityType.ActorNetwork) {
		const chainId =
			typeof id === 'number'
				? (id as ChainId)
				: (id.chainId ?? id.network) as ChainId | undefined
		return chainId != null ? networksByChainId[chainId]?.color : undefined
	}
	if (isCoinEntityType(type)) {
		const symbol = getSymbolForCoinEntity(type, id)
		return symbol ? coinColorBySymbol[symbol as keyof typeof coinColorBySymbol]?.color : undefined
	}
	return undefined
}
