export enum Protocol {
	UniswapV4 = 'UniswapV4',
	LiFi = 'LiFi',
	Odos = 'Odos',
	KyberSwap = 'KyberSwap',
	Relay = 'Relay',
	Yellow = 'Yellow',
	Cctp = 'Cctp',
	PartyKit = 'PartyKit',
	CircleGateway = 'Gateway',
}

/** Quote selection strategy; see spanDEX getQuote(strategy). */
export enum ProtocolStrategy {
	BestPrice = 'bestPrice',
	Fastest = 'fastest',
	EstimatedGas = 'estimatedGas',
	Priority = 'priority',
}

export const protocolStrategyDefinitions = [
	{ id: ProtocolStrategy.BestPrice, label: 'Best value' },
	{ id: ProtocolStrategy.Fastest, label: 'Fastest' },
	{ id: ProtocolStrategy.EstimatedGas, label: 'Lowest gas' },
	{ id: ProtocolStrategy.Priority, label: 'Priority' },
] as const satisfies readonly { id: ProtocolStrategy; label: string }[]

export const labelByProtocolStrategy: Record<ProtocolStrategy, string> =
	Object.fromEntries(
		protocolStrategyDefinitions.map((s) => [s.id, s.label]),
	) as Record<ProtocolStrategy, string>

export type ProtocolDefinition = {
	id: Protocol
	label: string
	icon: string
	detail: string
}

export const protocols = [
	{
		id: Protocol.UniswapV4,
		label: 'Uniswap V4',
		icon: (await import('$/assets/providers/uniswap.svg?url')).default,
		detail: 'Decentralized exchange',
	},
	{
		id: Protocol.LiFi,
		label: 'LI.FI',
		icon: (await import('$/assets/providers/lifi.svg?url')).default,
		detail: 'Multi-chain aggregator',
	},
	{
		id: Protocol.Odos,
		label: 'Odos',
		icon: (await import('$/assets/providers/odos.svg?url')).default,
		detail: 'DEX aggregator (via spanDEX)',
	},
	{
		id: Protocol.KyberSwap,
		label: 'KyberSwap',
		icon: (await import('$/assets/providers/kyberswap.svg?url')).default,
		detail: 'DEX aggregator (via spanDEX)',
	},
	{
		id: Protocol.Relay,
		label: 'Relay',
		icon: (await import('$/assets/providers/relay.svg?url')).default,
		detail: 'DEX aggregator (via spanDEX)',
	},
	{
		id: Protocol.Yellow,
		label: 'Yellow',
		icon: (await import('$/assets/providers/yellow.svg?url')).default,
		detail: 'State channel network',
	},
	{
		id: Protocol.Cctp,
		label: 'Circle CCTP',
		icon: (await import('$/assets/providers/cctp.svg?url')).default,
		detail: 'Native USDC bridge',
	},
	{
		id: Protocol.PartyKit,
		label: 'PartyKit',
		icon: (await import('$/assets/providers/partykit.svg?url')).default,
		detail: 'Real-time rooms',
	},
	{
		id: Protocol.CircleGateway,
		label: 'Circle Gateway',
		icon: (await import('$/assets/providers/circle.svg?url')).default,
		detail: 'Unified USDC balance',
	},
] as const satisfies readonly ProtocolDefinition[]

export const protocolsById = Object.fromEntries(
	protocols.map((protocol) => [protocol.id, protocol])
)
