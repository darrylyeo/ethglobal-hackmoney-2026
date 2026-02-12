import {
	networkConfigsByChainId,
} from '$/constants/networks.ts'
import type { ParsedNetworkParam } from '$/constants/networks.ts'
import { patternByPatternType } from '$/constants/patterns.ts'
import type { PatternType } from '$/constants/patterns.ts'
import { deserializeNetworkId } from '$/lib/id-serialization.ts'

export const matchesEntityRefPattern = (value: string, type: PatternType): boolean => (
	patternByPatternType[type].pattern.test(value)
)

/** Resolve [name] from /network/[name]: slug, eip155:chainId, or numeric chainId. */
export const parseNetworkNameParam = (name: string): ParsedNetworkParam | null => {
	const id = deserializeNetworkId(name)
	if (!id) return null
	const config = networkConfigsByChainId[id.chainId] ?? null
	return config
		? {
				chainId: config.chainId,
				config,
				slug: config.slug,
				caip2: config.caip2,
			}
		: null
}
