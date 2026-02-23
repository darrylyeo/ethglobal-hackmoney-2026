/**
 * Serialize/deserialize entity IDs to string formats (spec 094).
 * Constants hold metadata only; conversion lives here and at route/param call sites.
 */

import { networksByChainId } from '$/constants/networks.ts'
import { Network$IdSerializationType } from '$/constants/id-serializations.ts'
import type { Network$Id } from '$/data/Network.ts'

export const serializeNetworkId = (
	id: Network$Id,
	format: Network$IdSerializationType,
) => (
	format === Network$IdSerializationType.ChainId ?
		String(id.chainId)
	: format === Network$IdSerializationType.Caip2 ?
		`eip155:${id.chainId}`
	:
		String(id.chainId)
)

export const deserializeNetworkId = (value: string) => {
	const decoded = decodeURIComponent(value)
	if (/^\d+$/.test(decoded)) {
		const network = networksByChainId[Number(decoded)] ?? null
		return network ? { chainId: network.chainId } : null
	}
	const caipMatch = /^eip155:(\d+)$/i.exec(decoded)
	if (caipMatch) {
		const chainId = Number(caipMatch[1])
		const network = networksByChainId[chainId] ?? null
		return network ? { chainId: network.chainId } : null
	}
	return null
}
