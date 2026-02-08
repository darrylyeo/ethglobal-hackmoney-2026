export enum Protocol {
	UniswapV4 = 'UniswapV4',
	LiFi = 'LiFi',
	Yellow = 'Yellow',
	Cctp = 'Cctp',
	PartyKit = 'PartyKit',
	CircleGateway = 'Gateway',
}

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
	},
	{
		id: Protocol.PartyKit,
		label: 'PartyKit',
		icon: '🎉',
		detail: 'Real-time rooms',
	},
	{
		id: Protocol.CircleGatewayateway,
		label: 'Circle Gateway',
		icon: (await import('$/assets/providers/circle.svg?url')).default,
		detail: 'Unified USDC balance',
	},
] as const satisfies readonly ProtocolDefinition[]

export const protocolsById = Object.fromEntries(
	protocols.map((protocol) => [protocol.id, protocol]),
)
