/**
 * spanDEX meta-aggregator provider keys. Maps ProtocolId to SDK provider id for getQuotes/getQuote.
 */

import { ProtocolId } from '$/constants/protocols.ts'

/** spanDEX SDK provider key (ProviderKey from @spandex/core). */
export enum SpandexProviderId {
	Lifi = 'lifi',
	Odos = 'odos',
	KyberSwap = 'kyberswap',
	Relay = 'relay',
}

export const spandexProviderMappings = [
	{ protocol: ProtocolId.LiFi, provider: SpandexProviderId.Lifi },
	{ protocol: ProtocolId.Odos, provider: SpandexProviderId.Odos },
	{ protocol: ProtocolId.KyberSwap, provider: SpandexProviderId.KyberSwap },
	{ protocol: ProtocolId.Relay, provider: SpandexProviderId.Relay },
] as const satisfies readonly { protocol: ProtocolId; provider: SpandexProviderId }[]

export const spandexSwapProtocols: readonly ProtocolId[] =
	spandexProviderMappings.map((m) => m.protocol)
export const protocolToSpandexProvider: Partial<
	Record<ProtocolId, SpandexProviderId>
> = Object.fromEntries(
	spandexProviderMappings.map((m) => [m.protocol, m.provider]),
)

export const aggregatorBackedProtocols = spandexSwapProtocols
export const protocolToQuoteProvider = protocolToSpandexProvider
