import { ercTokens } from '$/constants/coins.ts'
import { EntityType } from '$/data/$EntityType.ts'

const coinAssets: Record<string, string> = {}

const norm = (a: string) => a.toLowerCase()

export const getSymbolForCoinEntity = (
	type: EntityType,
	id: Record<string, unknown>,
): string | undefined => {
	if (!isCoinEntityType(type)) return undefined
	const chainId = id.chainId ?? id.network
	const address = type === EntityType.ActorCoin
		? (id.tokenAddress as string | undefined)
		: (id.address as string | undefined)
	if (typeof chainId !== 'number' || typeof address !== 'string') return undefined
	const token = ercTokens.find(
		(t) => t.chainId === chainId && norm(t.address) === norm(address),
	)
	return token?.symbol
}

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
