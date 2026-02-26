import { ProtocolId, protocolsById } from '$/constants/protocols.ts'
import { isCctpSupportedChain } from '$/lib/cctp.ts'
import { isGatewaySupportedChain } from '$/lib/gateway.ts'

const BRIDGE_PROTOCOLS: { id: ProtocolId; supported: (from: number | null, to: number | null, isTestnet: boolean) => boolean }[] = [
	{ id: ProtocolId.Cctp, supported: (from, to) => from != null && to != null && isCctpSupportedChain(from) && isCctpSupportedChain(to) },
	{ id: ProtocolId.LiFi, supported: (from, to) => from != null && to != null },
	{
		id: ProtocolId.CircleGateway,
		supported: (from, to, isTestnet) =>
			from != null && to != null && isGatewaySupportedChain(from, isTestnet) && isGatewaySupportedChain(to, isTestnet),
	},
	{ id: ProtocolId.NearIntents, supported: (from, to) => from != null && to != null },
]

export function getBridgeProtocolOptions(
	fromChainId: number | null,
	toChainId: number | null,
	isTestnet: boolean,
) {
	return BRIDGE_PROTOCOLS.filter(({ supported }) => supported(fromChainId, toChainId, isTestnet)).map(
		({ id }) => protocolsById[id],
	)
}
