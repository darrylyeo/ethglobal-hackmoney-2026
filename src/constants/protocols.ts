export enum ProtocolId {
	Cctp = 'Cctp',
	CircleGateway = 'Gateway',
	KyberSwap = 'KyberSwap',
	LiFi = 'LiFi',
	NearIntents = 'NearIntents',
	Odos = 'Odos',
	PartyKit = 'PartyKit',
	Relay = 'Relay',
	UniswapV4 = 'UniswapV4',
	Yellow = 'Yellow',
}

export type Protocol = {
	id: ProtocolId
	label: string
	icon: string
	detail: string
}

export type ProtocolDefinition = Protocol

export const protocols: readonly Protocol[] = [
	{
		id: ProtocolId.UniswapV4,
		label: 'Uniswap V4',
		icon: (await import('$/assets/providers/uniswap.svg?url')).default,
		detail: 'Decentralized exchange',
	},
	{
		id: ProtocolId.LiFi,
		label: 'LI.FI',
		icon: (await import('$/assets/providers/lifi.svg?url')).default,
		detail: 'Multi-chain aggregator',
	},
	{
		id: ProtocolId.Odos,
		label: 'Odos',
		icon: (await import('$/assets/providers/odos.svg?url')).default,
		detail: 'DEX aggregator (via spanDEX)',
	},
	{
		id: ProtocolId.KyberSwap,
		label: 'KyberSwap',
		icon: (await import('$/assets/providers/kyberswap.svg?url')).default,
		detail: 'DEX aggregator (via spanDEX)',
	},
	{
		id: ProtocolId.Relay,
		label: 'Relay',
		icon: (await import('$/assets/providers/relay.svg?url')).default,
		detail: 'DEX aggregator (via spanDEX)',
	},
	{
		id: ProtocolId.Yellow,
		label: 'Yellow',
		icon: (await import('$/assets/providers/yellow.svg?url')).default,
		detail: 'State channel network',
	},
	{
		id: ProtocolId.Cctp,
		label: 'Circle CCTP',
		icon: (await import('$/assets/providers/cctp.svg?url')).default,
		detail: 'Native USDC bridge',
	},
	{
		id: ProtocolId.PartyKit,
		label: 'PartyKit',
		icon: (await import('$/assets/providers/partykit.svg?url')).default,
		detail: 'Real-time rooms',
	},
	{
		id: ProtocolId.CircleGateway,
		label: 'Circle Gateway',
		icon: (await import('$/assets/providers/circle.svg?url')).default,
		detail: 'Unified USDC balance',
	},
	{
		id: ProtocolId.NearIntents,
		label: 'NEAR Intents',
		icon: (await import('$/assets/providers/lifi.svg?url')).default,
		detail: 'One-step swap/bridge via LI.FI order server',
	},
]

export const protocolsById: Record<ProtocolId, Protocol> = Object.fromEntries(
	protocols.map((p) => [p.id, p]),
) as Record<ProtocolId, Protocol>

/** Aggregator id for choosing a supported Protocol for a given action (quote source). */
export enum ProtocolAggregatorId {
	None = 'none',
	Spandex = 'spandex',
}

/** Strategy for choosing among protocols when using an aggregator (best price, fastest, etc.). */
export enum ProtocolStrategy {
	BestPrice = 'bestPrice',
	Fastest = 'fastest',
	EstimatedGas = 'estimatedGas',
}

export const protocolStrategies = [
	{ id: ProtocolStrategy.BestPrice, label: 'Best value' },
	{ id: ProtocolStrategy.Fastest, label: 'Fastest' },
	{ id: ProtocolStrategy.EstimatedGas, label: 'Lowest gas' },
] as const satisfies readonly { id: ProtocolStrategy; label: string }[]

export type ProtocolAggregator = {
	id: ProtocolAggregatorId
	label: string
	strategies: readonly ProtocolStrategy[]
}

export const protocolAggregators: readonly ProtocolAggregator[] = [
	{ id: ProtocolAggregatorId.None, label: 'None', strategies: [] },
	{
		id: ProtocolAggregatorId.Spandex,
		label: 'Spandex',
		strategies: [
			ProtocolStrategy.BestPrice,
			ProtocolStrategy.Fastest,
			ProtocolStrategy.EstimatedGas,
		],
	},
]

export const protocolAggregatorsById: Record<ProtocolAggregatorId, ProtocolAggregator> =
	Object.fromEntries(protocolAggregators.map((a) => [a.id, a])) as Record<
		ProtocolAggregatorId,
		ProtocolAggregator
	>

export const protocolAggregatorIds: readonly ProtocolAggregatorId[] =
	protocolAggregators.map((a) => a.id)
