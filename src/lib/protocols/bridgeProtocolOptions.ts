import { Protocol, protocolsById } from '$/constants/protocols.ts'
import { isCctpSupportedChain } from '$/constants/cctp.ts'
import { isGatewaySupportedChain } from '$/constants/gateway.ts'
import type { ProtocolDefinition } from '$/constants/protocols.ts'

const BRIDGE_PROTOCOLS: { id: Protocol; supported: (from: number | null, to: number | null, isTestnet: boolean) => boolean }[] = [
	{ id: Protocol.Cctp, supported: (from, to) => from != null && to != null && isCctpSupportedChain(from) && isCctpSupportedChain(to) },
	{ id: Protocol.LiFi, supported: (from, to) => from != null && to != null },
	{
		id: Protocol.CircleGateway,
		supported: (from, to, isTestnet) =>
			from != null && to != null && isGatewaySupportedChain(from, isTestnet) && isGatewaySupportedChain(to, isTestnet),
	},
]

export function getBridgeProtocolOptions(
	fromChainId: number | null,
	toChainId: number | null,
	isTestnet: boolean,
): ProtocolDefinition[] {
	return BRIDGE_PROTOCOLS.filter(({ supported }) => supported(fromChainId, toChainId, isTestnet)).map(
		({ id }) => protocolsById[id],
	)
}
