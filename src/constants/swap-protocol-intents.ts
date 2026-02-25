/**
 * Swap protocol choice. Auto uses spanDEX to aggregate LiFi/Odos/KyberSwap/Relay.
 * Protocols are first-class; spanDEX is the aggregation layer, not a protocol.
 */

import { ProtocolId } from '$/constants/protocols.ts'

/** Swap option id. Auto = spanDEX aggregates with strategy. */
export enum SwapProtocolId {
	Auto = 'auto',
	UniswapV4 = 'uniswap',
	LiFi = 'lifi',
	Odos = 'odos',
	KyberSwap = 'kyberswap',
	Relay = 'relay',
	NearIntents = 'near-intents',
}

export const swapProtocolMappings = [
	{ id: SwapProtocolId.Auto, protocol: null },
	{ id: SwapProtocolId.UniswapV4, protocol: ProtocolId.UniswapV4 },
	{ id: SwapProtocolId.LiFi, protocol: ProtocolId.LiFi },
	{ id: SwapProtocolId.Odos, protocol: ProtocolId.Odos },
	{ id: SwapProtocolId.KyberSwap, protocol: ProtocolId.KyberSwap },
	{ id: SwapProtocolId.Relay, protocol: ProtocolId.Relay },
	{ id: SwapProtocolId.NearIntents, protocol: ProtocolId.NearIntents },
] as const satisfies readonly { id: SwapProtocolId; protocol: ProtocolId | null }[]

export const swapIdToProtocol: Partial<Record<SwapProtocolId, ProtocolId>> =
	Object.fromEntries(
		swapProtocolMappings
			.filter((m): m is typeof m & { protocol: ProtocolId } => m.protocol != null)
			.map((m) => [m.id, m.protocol]),
	) as Partial<Record<SwapProtocolId, ProtocolId>>
export const protocolToSwapId: Partial<Record<ProtocolId, SwapProtocolId>> =
	Object.fromEntries(
		swapProtocolMappings
			.filter((m): m is typeof m & { protocol: ProtocolId } => m.protocol != null)
			.map((m) => [m.protocol, m.id]),
	) as Partial<Record<ProtocolId, SwapProtocolId>>

export const swapProtocolIdsWithDef: {
	id: SwapProtocolId
	protocol: ProtocolId | null
}[] = swapProtocolMappings.map((m) => ({
	id: m.id,
	protocol: m.protocol,
}))
