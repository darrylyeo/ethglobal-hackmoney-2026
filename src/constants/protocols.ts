export enum Protocol {
	UniswapV4 = 'UniswapV4',
	LiFi = 'LiFi',
	Yellow = 'Yellow',
	Cctp = 'Cctp',
	PartyKit = 'PartyKit',
	CircleGateway = 'Gateway',
}

export enum ProtocolTag {
	Fastest = 'fastest',
	BestValue = 'best-value',
}

export const protocolTagLabels: Record<ProtocolTag, string> = {
	[ProtocolTag.Fastest]: 'Fastest',
	[ProtocolTag.BestValue]: 'Best value',
}

export type ProtocolDefinition = {
	id: Protocol
	label: string
	icon: string
	detail: string
	tags?: readonly ProtocolTag[]
}

export const protocols = [
	{
		id: Protocol.UniswapV4,
		label: 'Uniswap V4',
		icon: (await import('$/assets/providers/uniswap.svg?url')).default,
		detail: 'Decentralized exchange',
		tags: [ProtocolTag.BestValue],
	},
	{
		id: Protocol.LiFi,
		label: 'LI.FI',
		icon: (await import('$/assets/providers/lifi.svg?url')).default,
		detail: 'Multi-chain aggregator',
		tags: [ProtocolTag.Fastest],
	},
	{
		id: Protocol.Yellow,
		label: 'Yellow',
		icon: '💛',
		detail: 'State channel network',
	},
	{
		id: Protocol.Cctp,
		label: 'Circle CCTP',
		icon: (await import('$/assets/providers/cctp.svg?url')).default,
		detail: 'Native USDC bridge',
		tags: [ProtocolTag.BestValue],
	},
	{
		id: Protocol.PartyKit,
		label: 'PartyKit',
		icon: '🎉',
		detail: 'Real-time rooms',
	},
	{
		id: Protocol.CircleGateway,
		label: 'Circle Gateway',
		icon: (await import('$/assets/providers/circle.svg?url')).default,
		detail: 'Unified USDC balance',
		tags: [ProtocolTag.BestValue],
	},
] as const satisfies readonly ProtocolDefinition[]

export const protocolsById = Object.fromEntries(
	protocols.map((protocol) => [protocol.id, protocol]),
)
