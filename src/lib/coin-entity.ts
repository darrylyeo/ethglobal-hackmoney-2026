import { type CoinId, coinById } from '$/constants/coins.ts'
import {
	nativeCurrencyByNetwork,
	erc20TokenByNetwork,
} from '$/constants/coin-instances.ts'
import { EntityType } from '$/data/$EntityType.ts'

export const COIN_ENTITY_TYPES = new Set([
	EntityType.ActorCoin,
	EntityType.Coin,
	EntityType.TokenListCoin,
])

export const getCoinIdForCoinEntity = (
	type: EntityType,
	id: Record<string, unknown>,
): CoinId | undefined => {
	if (!COIN_ENTITY_TYPES.has(type)) return undefined
	const chainId =
		(id.$network as { chainId?: number } | undefined)?.chainId ??
		id.chainId ??
		id.network
	if (type === EntityType.Coin && !('address' in id)) {
		if (typeof chainId !== 'number') return undefined
		return nativeCurrencyByNetwork.get(chainId)?.[0]?.coinId
	}
	const address =
		type === EntityType.ActorCoin
			? (id.tokenAddress as string | undefined)
			: (id.address as string | undefined)
	if (typeof chainId !== 'number' || typeof address !== 'string')
		return undefined
	const addr = address.toLowerCase()
	return erc20TokenByNetwork
		.get(chainId)
		?.find((t) => t.$id.address.toLowerCase() === addr)?.coinId
}

export const getSymbolForCoinEntity = (
	type: EntityType,
	id: Record<string, unknown>,
): string | undefined => {
	const coinId = getCoinIdForCoinEntity(type, id)
	return coinId != null ? coinById[coinId]?.symbol : undefined
}
