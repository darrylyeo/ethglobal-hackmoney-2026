/**
 * Icon fetch schema and path resolution for chains, coins, providers.
 * Canonical types and registries per spec 045/052.
 */

export enum IconTarget {
	Chain = 'Chain',
	Coin = 'Coin',
	Provider = 'Provider',
}

export enum IconKind {
	Logo = 'Logo',
	Wordmark = 'Wordmark',
	LogoAndWordmark = 'LogoAndWordmark',
}

export type IconStyle = string

export enum FetchTypeKind {
	Zip = 'Zip',
	Png = 'Png',
	Url = 'Url',
}

export type FetchType =
	| { fetchType: FetchTypeKind.Zip; zipUrl: string; pathInZip: string }
	| { fetchType: FetchTypeKind.Png; url: string }
	| { fetchType: FetchTypeKind.Url; url: string }

export type IconFetchItem = {
	target: IconTarget
	id: string | number
	kind?: IconKind
	style?: IconStyle
	fetch: FetchType
}

export type IconAlias = {
	target: IconTarget
	fromId: string | number
	toId: string | number
}

export function iconSuffix(
	kind: IconKind | undefined,
	style: IconStyle | undefined,
): string {
	const k = kind ?? IconKind.Logo
	if (k === IconKind.Wordmark)
		return style != null ? `wordmark-${style}` : 'wordmark'
	if (k === IconKind.LogoAndWordmark)
		return style != null ? `logo-and-wordmark-${style}` : 'logo-and-wordmark'
	if (k === IconKind.Logo && style != null) return style
	return ''
}

export function isDefaultIcon(kind?: IconKind, style?: IconStyle): boolean {
	return (kind === undefined || kind === IconKind.Logo) && style == null
}

export function iconFilename(
	id: string | number,
	kind?: IconKind,
	style?: IconStyle,
): string {
	const suffix = iconSuffix(kind, style)
	return suffix ? `${id}-${suffix}.svg` : `${id}.svg`
}

const ICONS_BASE = '/icons'

export function chainIconPath(
	chainId: string | number,
	kind?: IconKind,
	style?: IconStyle,
): string {
	return `${ICONS_BASE}/chains/${iconFilename(chainId, kind, style)}`
}

export function coinIconPath(
	id: string,
	kind?: IconKind,
	style?: IconStyle,
): string {
	return `${ICONS_BASE}/coins/${iconFilename(id, kind, style)}`
}

export function providerIconPath(
	id: string,
	kind?: IconKind,
	style?: IconStyle,
): string {
	return `${ICONS_BASE}/providers/${iconFilename(id, kind, style)}`
}

/** Coin icon fetch list: id = lowercase symbol or token list key. Sources: token lists, official asset repos. */
export const coinIconFetchItems = [
	// USDC: token list (Uniswap assets); https://www.circle.com/en/brand for official
	{
		target: IconTarget.Coin,
		id: 'usdc',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
		},
	},
	// ETH: ethereum.org
	{
		target: IconTarget.Coin,
		id: 'eth',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-glyph.svg',
		},
	},
	// USDT: token list (Uniswap assets)
	{
		target: IconTarget.Coin,
		id: 'usdt',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
		},
	},
] as const satisfies readonly IconFetchItem[]

/** Provider icon fetch list: id = lowercase provider name. Sources: official brand kits, docs. */
export const providerIconFetchItems = [
	// LI.FI: https://docs.li.fi/brand-assets
	{
		target: IconTarget.Provider,
		id: 'lifi',
		kind: IconKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.li.fi/img/brand/logo.svg',
		},
	},
	// Circle CCTP: https://www.circle.com/en/brand; SVG from vectorlogo.zone
	{
		target: IconTarget.Provider,
		id: 'cctp',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://www.vectorlogo.zone/logos/circle/circle-icon.svg',
		},
	},
	// Uniswap: token list / Uniswap assets repo
	{
		target: IconTarget.Provider,
		id: 'uniswap',
		kind: IconKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
		},
	},
] as const satisfies readonly IconFetchItem[]
