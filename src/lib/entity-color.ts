import type { ChainId } from '$/constants/chain-id.ts'
import { coinColorBySymbol, networkColorByChainId } from '$/constants/colors.ts'
import type { IntentEntityRef } from '$/constants/intents.ts'
import { EntityType } from '$/data/$EntityType.ts'
import { getSymbolForCoinEntity, isCoinEntityType } from '$/lib/coin-icon.ts'

export const getEntityColor = (entity: IntentEntityRef): string | undefined => {
	const { type, id } = entity
	if (type === EntityType.Network || type === EntityType.ActorNetwork) {
		const chainId =
			typeof id === 'number'
				? (id as ChainId)
				: (id.chainId ?? id.network) as ChainId | undefined
		return chainId != null ? networkColorByChainId[chainId] : undefined
	}
	if (isCoinEntityType(type)) {
		const symbol = getSymbolForCoinEntity(type, id)
		return symbol ? coinColorBySymbol[symbol] : undefined
	}
	return undefined
}
