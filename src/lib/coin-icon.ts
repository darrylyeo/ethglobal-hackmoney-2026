import { EntityType } from '$/data/$EntityType.ts'

const coinAssets: Record<string, string> = {}

const loadAssets = async () => {
	if (Object.keys(coinAssets).length > 0) return
	coinAssets['eth'] = (await import('$/assets/coins/eth.svg?url')).default
	coinAssets['usdc'] = (await import('$/assets/coins/usdc.svg?url')).default
	coinAssets['usdt'] = (await import('$/assets/coins/usdt.svg?url')).default
}

const COIN_ENTITY_TYPES = new Set([
	EntityType.ActorCoin,
	EntityType.Coin,
	EntityType.TokenListCoin,
])

export const isCoinEntityType = (type: EntityType) => (
	COIN_ENTITY_TYPES.has(type)
)

export const getCoinIconUrl = async (symbol?: string) => {
	await loadAssets()
	if (!symbol) return coinAssets['eth']
	return coinAssets[symbol.toLowerCase()] ?? coinAssets['eth']
}
