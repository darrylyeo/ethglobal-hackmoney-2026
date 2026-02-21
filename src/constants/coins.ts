/**
 * Canonical coin identity (symbol, color, icon). Spec 116.
 */

export enum CoinId {
	ETH = 'ETH',
	USDC = 'USDC',
	USDT = 'USDT',
	MATIC = 'MATIC',
	AVAX = 'AVAX',
	CELO = 'CELO',
	UNI = 'UNI',
	S = 'S',
	SEI = 'SEI',
	XDC = 'XDC',
	EDU = 'EDU',
	MITO = 'MITO',
	TAC = 'TAC',
}

export type Coin = {
	id: CoinId
	symbol: string
	color: string
	icon?: string
}

export const coins = [
	{
		id: CoinId.ETH,
		symbol: 'ETH',
		color: '#627EEA',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
	{
		id: CoinId.USDC,
		symbol: 'USDC',
		color: '#2775CA',
		icon: (await import('$/assets/coins/usdc.svg?url')).default,
	},
	{
		id: CoinId.USDT,
		symbol: 'USDT',
		color: '#26A17B',
		icon: (await import('$/assets/coins/usdt.svg?url')).default,
	},
	{
		id: CoinId.MATIC,
		symbol: 'MATIC',
		color: '#7B3FE4',
		icon: (await import('$/assets/coins/pol.svg?url')).default,
	},
	{
		id: CoinId.AVAX,
		symbol: 'AVAX',
		color: '#E84142',
		icon: (await import('$/assets/coins/avax.svg?url')).default,
	},
	{
		id: CoinId.CELO,
		symbol: 'CELO',
		color: '#FCFF52',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
	{
		id: CoinId.UNI,
		symbol: 'UNI',
		color: '#F50DB4',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
	{
		id: CoinId.S,
		symbol: 'S',
		color: '#000000',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
	{
		id: CoinId.SEI,
		symbol: 'SEI',
		color: '#C1121F',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
	{
		id: CoinId.XDC,
		symbol: 'XDC',
		color: '#254C81',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
	{
		id: CoinId.EDU,
		symbol: 'EDU',
		color: '#7C3AED',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
	{
		id: CoinId.MITO,
		symbol: 'MITO',
		color: '#6366F1',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
	{
		id: CoinId.TAC,
		symbol: 'TAC',
		color: '#3B82F6',
		icon: (await import('$/assets/coins/eth.svg?url')).default,
	},
] as const satisfies readonly Coin[]

export const coinById = Object.fromEntries(
	coins.map((c) => [c.id, c]),
) as Record<CoinId, (typeof coins)[number]>

export const coinBySymbol = Object.fromEntries(
	coins.map((c) => [c.symbol, c]),
) as Record<string, (typeof coins)[number]>
