/**
 * Resolve asset (icon) URLs via import (glob). Use getAssetUrl(path) or subject-specific getters.
 * Paths: '/icons/chains/1.svg' or 'chains/1.svg' → resolved asset URL.
 */

import {
	AssetKind,
	assetFilename,
	type AssetStyle,
} from '$/constants/assets'

const chainModules = import.meta.glob<{ default: string }>('./chains/*.svg', {
	query: '?url',
	import: 'default',
	eager: true,
})
const coinModules = import.meta.glob<{ default: string }>('./coins/*.svg', {
	query: '?url',
	import: 'default',
	eager: true,
})
const providerModules = import.meta.glob<{ default: string }>(
	'./providers/*.svg',
	{
		query: '?url',
		import: 'default',
	eager: true,
},
)

function toLookupKey(path: string): string {
	return path.replace(/^\/(icons|assets)\//, '').replace(/^\.\//, '')
}

function toMapKey(globKey: string): string {
	return globKey.replace(/^\.\//, '')
}

const chainUrls: Record<string, string> = Object.fromEntries(
	Object.entries(chainModules).map(([k, v]) => [toMapKey(k), v.default]),
)
const coinUrls: Record<string, string> = Object.fromEntries(
	Object.entries(coinModules).map(([k, v]) => [toMapKey(k), v.default]),
)
const providerUrls: Record<string, string> = Object.fromEntries(
	Object.entries(providerModules).map(([k, v]) => [toMapKey(k), v.default]),
)

export function getAssetUrl(path: string): string | undefined {
	const key = toLookupKey(path)
	return chainUrls[key] ?? coinUrls[key] ?? providerUrls[key]
}

export function chainAssetUrl(
	chainId: string | number,
	kind?: AssetKind,
	style?: AssetStyle,
): string | undefined {
	return chainUrls[`chains/${assetFilename(chainId, kind, style)}`]
}

export function coinAssetUrl(
	id: string,
	kind?: AssetKind,
	style?: AssetStyle,
): string | undefined {
	return coinUrls[`coins/${assetFilename(id, kind, style)}`]
}

export function providerAssetUrl(
	id: string,
	kind?: AssetKind,
	style?: AssetStyle,
): string | undefined {
	return providerUrls[`providers/${assetFilename(id, kind, style)}`]
}
