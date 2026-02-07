import type { ChainId } from '$/constants/networks.ts'
import {
	getNetworkByCaip2,
	getNetworkBySlug,
	networkConfigsByChainId,
	toCaip2,
	toNetworkSlug,
} from '$/constants/networks.ts'
import type { ParsedNetworkParam } from '$/constants/networks.ts'
import { patternByPatternType } from '$/constants/patterns.ts'
import type { PatternType } from '$/constants/patterns.ts'

export const matchesEntityRefPattern = (value: string, type: PatternType): boolean => (
	patternByPatternType[type].pattern.test(value)
)

/** Resolve [name] from /network/[name]: slug, eip155:chainId, or numeric chainId. */
export const parseNetworkNameParam = (name: string): ParsedNetworkParam | null => {
	const decoded = decodeURIComponent(name)
	if (/^\d+$/.test(decoded)) {
		const config = networkConfigsByChainId[Number(decoded) as ChainId] ?? null
		return config
			? {
					chainId: config.chainId,
					config,
					slug: toNetworkSlug(config.name),
					caip2: toCaip2(config.chainId),
				}
			: null
	}
	if (decoded.includes(':')) {
		const config = getNetworkByCaip2(decoded)
		return config
			? {
					chainId: config.chainId,
					config,
					slug: toNetworkSlug(config.name),
					caip2: toCaip2(config.chainId),
				}
			: null
	}
	const config = getNetworkBySlug(decoded)
	return config
		? {
				chainId: config.chainId,
				config,
				slug: toNetworkSlug(config.name),
				caip2: toCaip2(config.chainId),
			}
		: null
}
