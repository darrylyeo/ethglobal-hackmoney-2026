/**
 * Serialize/deserialize entity IDs to string formats (spec 094).
 * Constants hold metadata only; conversion lives here and at route/param call sites.
 */

import {
	networkConfigsByCaip2,
	networkConfigsByChainId,
	networkConfigsBySlug,
} from '$/constants/networks.ts'
import { Network$IdSerializationType } from '$/constants/id-serializations.ts'
import type { Network$Id } from '$/data/Network.ts'

export const serializeNetworkId = (
	id: Network$Id,
	format: Network$IdSerializationType,
): string => {
	const config = networkConfigsByChainId[id.chainId as number]
	return (
		format === Network$IdSerializationType.ChainId ?
			String(id.chainId)
		: format === Network$IdSerializationType.Caip2 ?
			(networkConfigsByChainId[id.chainId as number]?.caip2 ?? `eip155:${id.chainId}`)
		: config ?
			config.slug.toLowerCase()
		:
			String(id.chainId)
	)
}

export const deserializeNetworkId = (value: string): Network$Id | null => {
	const decoded = decodeURIComponent(value)
	if (/^\d+$/.test(decoded)) {
		const config = networkConfigsByChainId[Number(decoded)] ?? null
		return config ? { chainId: config.chainId } : null
	}
	if (decoded.includes(':')) {
		const config = networkConfigsByCaip2[decoded] ?? null
		return config ? { chainId: config.chainId } : null
	}
	const config = networkConfigsBySlug[decoded.toLowerCase()] ?? null
	return config ? { chainId: config.chainId } : null
}
