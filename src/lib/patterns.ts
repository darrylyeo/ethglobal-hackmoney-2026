import {
	networksByChainId,
} from '$/constants/networks.ts'
import type { ParsedNetworkParam } from '$/constants/networks.ts'
import { patternByPatternType } from '$/constants/patterns.ts'
import type { PatternType } from '$/constants/patterns.ts'
import { deserializeNetworkId } from '$/lib/id-serialization.ts'

export const matchesEntityRefPattern = (value: string, type: PatternType) => (
	patternByPatternType[type].pattern.test(value)
)

/** Resolve [name] from /network/[name]: slug, eip155:chainId, or numeric chainId. */
export const parseNetworkNameParam = (name: string) => {
	const id = deserializeNetworkId(name)
	if (!id) return null
	const network = networksByChainId[id.chainId] ?? null
	return network
		? {
				chainId: network.chainId,
				network,
				slug: network.slug,
				caip2: network.caip2,
			}
		: null
}
