import type { AssetStyle } from '$/constants/assets.ts'
import { AssetKind } from '$/constants/assets.ts'

export const assetSuffix = (
	kind: AssetKind | undefined,
	style: AssetStyle | undefined,
) => {
	const k = kind ?? AssetKind.Logo
	if (k === AssetKind.Wordmark)
		return style != null ? `wordmark-${style}` : 'wordmark'
	if (k === AssetKind.LogoAndWordmark)
		return style != null ? `logo-and-wordmark-${style}` : 'logo-and-wordmark'
	if (k === AssetKind.Logo && style != null) return style
	return ''
}

export const isDefaultAsset = (kind?: AssetKind, style?: AssetStyle) => (
	(kind === undefined || kind === AssetKind.Logo) && style == null
)

export const assetFilename = (
	id: string | number,
	kind?: AssetKind,
	style?: AssetStyle,
) => {
	const suffix = assetSuffix(kind, style)
	return suffix ? `${id}-${suffix}.svg` : `${id}.svg`
}

