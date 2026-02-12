/**
 * User-facing bridge choice (protocolIntent). Maps to Protocol for execution.
 */

import { Protocol } from '$/constants/protocols.ts'

/** Bridge option id used in action params (e.g. protocolIntent). */
export enum BridgeProtocolId {
	Cctp = 'cctp',
	Lifi = 'lifi',
	Gateway = 'gateway',
}

export const bridgeProtocolMappings = [
	{ id: BridgeProtocolId.Cctp, protocol: Protocol.Cctp },
	{ id: BridgeProtocolId.Lifi, protocol: Protocol.LiFi },
	{ id: BridgeProtocolId.Gateway, protocol: Protocol.CircleGateway },
] as const satisfies readonly { id: BridgeProtocolId; protocol: Protocol }[]

export const bridgeProtocolIds: readonly BridgeProtocolId[] =
	bridgeProtocolMappings.map((m) => m.id)
export const bridgeIdToProtocol: Record<BridgeProtocolId, Protocol> =
	Object.fromEntries(
		bridgeProtocolMappings.map((m) => [m.id, m.protocol]),
	) as Record<BridgeProtocolId, Protocol>
export const protocolToBridgeId: Partial<Record<Protocol, BridgeProtocolId>> =
	Object.fromEntries(bridgeProtocolMappings.map((m) => [m.protocol, m.id]))
