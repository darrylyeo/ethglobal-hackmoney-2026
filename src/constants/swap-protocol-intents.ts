/**
 * Swap protocol choice. Auto uses spanDEX to aggregate LiFi/Odos/KyberSwap/Relay.
 * Protocols are first-class; spanDEX is the aggregation layer, not a protocol.
 */

import { Protocol } from '$/constants/protocols.ts'

/** Swap option id. Auto = spanDEX aggregates with strategy. */
export enum SwapProtocolId {
	Auto = 'auto',
	UniswapV4 = 'uniswap',
	LiFi = 'lifi',
	Odos = 'odos',
	KyberSwap = 'kyberswap',
	Relay = 'relay',
}

export const swapProtocolMappings = [
	{ id: SwapProtocolId.Auto, protocol: null },
	{ id: SwapProtocolId.UniswapV4, protocol: Protocol.UniswapV4 },
	{ id: SwapProtocolId.LiFi, protocol: Protocol.LiFi },
	{ id: SwapProtocolId.Odos, protocol: Protocol.Odos },
	{ id: SwapProtocolId.KyberSwap, protocol: Protocol.KyberSwap },
	{ id: SwapProtocolId.Relay, protocol: Protocol.Relay },
] as const satisfies readonly { id: SwapProtocolId; protocol: Protocol | null }[]

export const swapIdToProtocol: Partial<Record<SwapProtocolId, Protocol>> =
	Object.fromEntries(
		swapProtocolMappings
			.filter((m): m is typeof m & { protocol: Protocol } => m.protocol != null)
			.map((m) => [m.id, m.protocol]),
	) as Partial<Record<SwapProtocolId, Protocol>>
export const protocolToSwapId: Partial<Record<Protocol, SwapProtocolId>> =
	Object.fromEntries(
		swapProtocolMappings
			.filter((m): m is typeof m & { protocol: Protocol } => m.protocol != null)
			.map((m) => [m.protocol, m.id]),
	) as Partial<Record<Protocol, SwapProtocolId>>

export const swapProtocolIdsWithDef: {
	id: SwapProtocolId
	protocol: Protocol | null
}[] = swapProtocolMappings.map((m) => ({
	id: m.id,
	protocol: m.protocol,
}))
