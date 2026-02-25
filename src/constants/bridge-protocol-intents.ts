/**
 * User-facing bridge choice (protocolIntent). Maps to ProtocolId for execution.
 */

import { ProtocolId } from '$/constants/protocols.ts'

/** Bridge option id used in action params (e.g. protocolIntent). */
export enum BridgeProtocolId {
	Cctp = 'cctp',
	Lifi = 'lifi',
	Gateway = 'gateway',
	NearIntents = 'near-intents',
}

export const bridgeProtocolMappings = [
	{ id: BridgeProtocolId.Cctp, protocol: ProtocolId.Cctp },
	{ id: BridgeProtocolId.Lifi, protocol: ProtocolId.LiFi },
	{ id: BridgeProtocolId.Gateway, protocol: ProtocolId.CircleGateway },
	{ id: BridgeProtocolId.NearIntents, protocol: ProtocolId.NearIntents },
] as const satisfies readonly { id: BridgeProtocolId; protocol: ProtocolId }[]

export const bridgeProtocolIds: readonly BridgeProtocolId[] =
	bridgeProtocolMappings.map((m) => m.id)
export const bridgeIdToProtocol: Record<BridgeProtocolId, ProtocolId> =
	Object.fromEntries(
		bridgeProtocolMappings.map((m) => [m.id, m.protocol]),
	) as Record<BridgeProtocolId, ProtocolId>
export const protocolToBridgeId: Partial<Record<ProtocolId, BridgeProtocolId>> =
	Object.fromEntries(bridgeProtocolMappings.map((m) => [m.protocol, m.id]))
