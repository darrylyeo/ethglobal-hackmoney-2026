/**
 * spanDEX meta-aggregator provider keys. Maps Protocol to SDK provider id for getQuotes/getQuote.
 */

import { Protocol } from '$/constants/protocols.ts'

/** spanDEX SDK provider key (ProviderKey from @spandex/core). */
export enum SpandexProviderId {
	Lifi = 'lifi',
	Odos = 'odos',
	KyberSwap = 'kyberswap',
	Relay = 'relay',
}

export const spandexProviderMappings = [
	{ protocol: Protocol.LiFi, provider: SpandexProviderId.Lifi },
	{ protocol: Protocol.Odos, provider: SpandexProviderId.Odos },
	{ protocol: Protocol.KyberSwap, provider: SpandexProviderId.KyberSwap },
	{ protocol: Protocol.Relay, provider: SpandexProviderId.Relay },
] as const satisfies readonly { protocol: Protocol; provider: SpandexProviderId }[]

export const spandexSwapProtocols: readonly Protocol[] =
	spandexProviderMappings.map((m) => m.protocol)
export const protocolToSpandexProvider: Partial<
	Record<Protocol, SpandexProviderId>
> = Object.fromEntries(
	spandexProviderMappings.map((m) => [m.protocol, m.provider]),
)
