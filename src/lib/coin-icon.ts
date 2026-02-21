import { ercTokens } from '$/constants/coins.ts'
import { EntityType } from '$/data/$EntityType.ts'

const coinAssets: Record<string, string> = {}

const norm = (a: string) => a.toLowerCase()

export const getSymbolForCoinEntity = (
	type: EntityType,
	id: Record<string, unknown>,
) => {
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
	coinAssets['aave'] = (await import('$/assets/coins/aave.svg?url')).default
	coinAssets['avax'] = (await import('$/assets/coins/avax.svg?url')).default
	coinAssets['bnb'] = (await import('$/assets/coins/bnb.svg?url')).default
	coinAssets['btc'] = (await import('$/assets/coins/btc.svg?url')).default
	coinAssets['comp'] = (await import('$/assets/coins/comp.svg?url')).default
	coinAssets['dai'] = (await import('$/assets/coins/dai.svg?url')).default
	coinAssets['degen'] = (await import('$/assets/coins/degen.svg?url')).default
	coinAssets['ens'] = (await import('$/assets/coins/ens.svg?url')).default
	coinAssets['eth'] = (await import('$/assets/coins/eth.svg?url')).default
	coinAssets['ftm'] = (await import('$/assets/coins/ftm.svg?url')).default
	coinAssets['mkr'] = (await import('$/assets/coins/mkr.svg?url')).default
	coinAssets['mnt'] = (await import('$/assets/coins/mnt.svg?url')).default
	coinAssets['one'] = (await import('$/assets/coins/one.svg?url')).default
	coinAssets['op'] = (await import('$/assets/coins/op.svg?url')).default
	coinAssets['pol'] = (await import('$/assets/coins/pol.svg?url')).default
	coinAssets['matic'] = coinAssets['pol']
	coinAssets['usdc'] = (await import('$/assets/coins/usdc.svg?url')).default
	coinAssets['usdt'] = (await import('$/assets/coins/usdt.svg?url')).default
	coinAssets['wbtc'] = (await import('$/assets/coins/wbtc.svg?url')).default
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
