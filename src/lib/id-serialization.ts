/**
 * Serialize/deserialize entity IDs to string formats (spec 094).
 * Constants hold metadata only; conversion lives here and at route/param call sites.
 */

import {
	networksByCaip2,
	networksByChainId,
	networksBySlug,
} from '$/constants/networks.ts'
import { Network$IdSerializationType } from '$/constants/id-serializations.ts'
import type { Network$Id } from '$/data/Network.ts'

export const serializeNetworkId = (
	id: Network$Id,
	format: Network$IdSerializationType,
) => {
	const network = networksByChainId[id.chainId as number]
	return (
		format === Network$IdSerializationType.ChainId ?
			String(id.chainId)
		: format === Network$IdSerializationType.Caip2 ?
			(networksByChainId[id.chainId as number]?.caip2 ?? `eip155:${id.chainId}`)
		: network ?
			network.slug.toLowerCase()
		:
			String(id.chainId)
	)
}

export const deserializeNetworkId = (value: string) => {
	const decoded = decodeURIComponent(value)
	if (/^\d+$/.test(decoded)) {
		const network = networksByChainId[Number(decoded)] ?? null
		return network ? { chainId: network.chainId } : null
	}
	if (decoded.includes(':')) {
		const network = networksByCaip2[decoded] ?? null
		return network ? { chainId: network.chainId } : null
	}
	const network = networksBySlug[decoded.toLowerCase()] ?? null
	return network ? { chainId: network.chainId } : null
}
