/**
 * Fetch official chain SVG icons (PNG wrapped as SVG when SVG unavailable). Prefer official network/chain websites over block explorers.
 * Run: bun run scripts/_fetch-chain-icons.ts then bun run icons:optimize (svgo).
 *
 * Dimensions: kind (ChainIconKind: Logo, Wordmark, LogoAndWordmark) and optional style (ChainIconStyle: Black, White, Light, Dark, ChainLight, Alt, etc.).
 * Naming: {chainId}.svg = Logo (default); {chainId}-wordmark.svg = Wordmark (default); {chainId}-wordmark-{style}.svg = Wordmark variant; {chainId}-logo-and-wordmark.svg = LogoAndWordmark (default); {chainId}-logo-and-wordmark-{style}.svg = full logo variant; {chainId}-{style}.svg = Logo style (e.g. 1-black, 137-white).
 *
 * Explorer-only (no direct SVG on official site): Sonic, Monad, Celo (chain light/dim/dark + brandassets + logo-and-wordmark-light); Monad chain-light/dim/dark from monadscan; World Chain dim/dark; Arbitrum default/light/chain-light/dim/dark/symbol-light + full logo from arbiscan; LogoAndWordmark Alt from arbitrumhub.io/brandkit.
 * Icons from official brand ZIP: Unichain (unichain.org/assets/zip/unichain-brand-kit.zip).
 * Explorer-only: HyperEVM (999) from hyperevmscan.io/brandassets (full logo + logo-and-wordmark-light).
 * Plume: docs.plumenetwork.xyz brand-assets → GitBook SVG zip (Logomark Red/Dark/White, Full Logo Black/White, Logomark-BG-Red/Black, Powered by Plume / Inverted).
 * PNG wrapped as SVG (no direct SVG): Ink (57073) from docs.inkonchain.com — symbol + full logo (LogoAndWordmark) + safe-margin symbol/wordmark.
 * Ethereum: ethereum.org/assets (glyph, diamonds, wordmarks, full logos); chain logo/light/dark + logo-and-wordmark light/dark/logo/wordmark/wordmark-dark/wordmark-light + symbol/symbol-light/symbol-dark + circle/circle-dark/circle-light from etherscan.io (explorer).
 * Sei: docs.sei.io/learn/general-brand-kit (symbol, full logo); chain light/dim/dark + symbol/symbol-light + logo-and-wordmark light/dark/logo from seiscan.io (explorer).
 * ZKsync: zksync.io (default); docs.zksync.io/logos for dark/light; explorer.zksync.io (symbol/arrows, logo-symbol, brandassets logo/logo-light/symbol-light/symbol-dark/circle/wordmark); ZIP full logo dark/white.
 * Base: github.com/base/brand-kit (TheSquare, Logotype, Basemark); chain light/dim/dark + full logo/symbol/symbol-light/dark + logo-and-wordmark light/dark/logo + circle/circle-dark/circle-light/wordmark from basescan.org (explorer).
 * Optimism: optimism.io/brand (Framer CDN logo, wordmark, avatar); light/chain-light/dim/dark/symbol/symbol-light/symbol-dark + full logo + circle/circle-dark/circle-light + wordmark/wordmark-dark/wordmark-light from optimistic.etherscan.io (explorer).
 * ZKsync: zksync.io (default); docs.zksync.io (dark/light); ZKsync-Brand.zip (full logo dark/white); ZKsync-Slogan.zip (slogan no-bg light/dark, with-bg light/dark/bg-1/bg-2).
 * Linea: linea.build (logomark, logotype); lineascan.build/brandassets — chain light/dim/dark, full logo, logo-light/dark, symbol/symbol-light/symbol-dark, circle/circle-dark/circle-light, wordmark/wordmark-dark/wordmark-light; official Linea-Brand-Assets.zip (CTF) — Logomark/Wordmark Black, White, Yellow/Blue/White BG; Token Round/Square SVG.
 * World Chain: world.org + Prismic CDN (fulllogo-1/2, wordmark-1/2, logomark-1/2); chain light/dim/dark + symbol/symbol-light + logo-and-wordmark light/dark + circle/circle-dark/circle-light/wordmark from worldscan.org (explorer).
 * Codex: docs.codex.xyz (Astro); codex.io/press-kit CDN (Logo colour + monochrome SVG); ZIP (GitHub — LogoAndWordmark chartreuse bg).
 * XDC: xinfin.org/brand-assets (official; primary/inverted/monotone icon + full logo); xdc.org/resources/brand-assets (Prismic CDN — primary white mono, foundation icon white mono); chain light/dim/dark + symbol/symbol-light/symbol-dark + logo-and-wordmark light/dark/logo + circle/circle-dark/circle-light/wordmark from xdcscan.com (explorer).
 * Avalanche: shop.avax.network (official horizontal red); chain light/dim/dark + full logo/symbol/symbol-light + logo-and-wordmark light/dark/logo from snowscan.xyz (explorer).
 */

import { unzipSync } from 'fflate'
import { ChainId } from '../src/constants/networks'

const OUT_DIR = new URL('../static/networks/', import.meta.url)

/** Kind of asset: symbol/icon (Logo), text only (Wordmark), or full logo with wordmark (LogoAndWordmark). */
export enum ChainIconKind {
	Logo = 'Logo',
	Wordmark = 'Wordmark',
	LogoAndWordmark = 'LogoAndWordmark',
}

/** Style/theme or asset subtype: color variant, light/dark, or full logo/avatar asset. */
export enum ChainIconStyle {
	Black = 'black',
	Purple = 'purple',
	White = 'white',
	Light = 'light',
	Dark = 'dark',
	Dim = 'dim',
	MonotoneBlack = 'monotone-black',
	MonotoneWhite = 'monotone-white',
	SymbolLight = 'symbol-light',
	SymbolDark = 'symbol-dark',
	Logo = 'logo',
	Avatar = 'avatar',
	Rainbow = 'rainbow',
	Colored = 'colored',
	Basemark = 'basemark',
	BasemarkWhite = 'basemark-white',
	BasemarkBlack = 'basemark-black',
	LandscapeBlack = 'landscape-black',
	LandscapePurple = 'landscape-purple',
	Gray = 'gray',
	Symbol = 'symbol',
	PurplePurple = 'purple-purple',
	Vibrant = 'vibrant',
	VerticalLight = 'vertical-light',
	VerticalDark = 'vertical-dark',
	VerticalVibrant = 'vertical-vibrant',
	BlackWhite = 'black-white',
	LandscapeGray = 'landscape-gray',
	PortraitPurplePurple = 'portrait-purple-purple',
	LandscapePurplePurple = 'landscape-purple-purple',
	LogomarkDark = 'logomark-dark',
	LogomarkLight = 'logomark-light',
	ChainLight = 'chain-light',
	Alt = 'alt',
	YellowBg = 'yellow-bg',
	BlueBg = 'blue-bg',
	WhiteBg = 'white-bg',
	RedBg = 'red-bg',
	BlackBg = 'black-bg',
	PoweredBy = 'powered-by',
	Inverted = 'inverted',
	Slogan = 'slogan',
	SloganDark = 'slogan-dark',
	SloganBgLight = 'slogan-bg-light',
	SloganBgDark = 'slogan-bg-dark',
	SloganBg1 = 'slogan-bg-1',
	SloganBg2 = 'slogan-bg-2',
	TokenRound = 'token-round',
	TokenSquare = 'token-square',
	Circle = 'circle',
	CircleDark = 'circle-dark',
	CircleLight = 'circle-light',
	CircleBlackBg = 'circle-black-bg',
	CircleWhiteBg = 'circle-white-bg',
	SquareBlackBg = 'square-black-bg',
	SquareWhiteBg = 'square-white-bg',
	SafeMargin = 'safe-margin',
}

export type FetchType =
	| { fetchType: 'zip'; zipUrl: string; pathInZip: string }
	| { fetchType: 'png'; url: string }
	| { fetchType: 'url'; url: string }

export type ChainIconItem = {
	chainId: ChainId
	kind?: ChainIconKind
	style?: ChainIconStyle
	fetch: FetchType
}

function suffixFromKindStyle(
	kind: ChainIconKind,
	style?: ChainIconStyle,
): string {
	if (kind === ChainIconKind.Wordmark)
		return style != null ? `wordmark-${style}` : 'wordmark'
	if (kind === ChainIconKind.LogoAndWordmark)
		return style != null ? `logo-and-wordmark-${style}` : 'logo-and-wordmark'
	if (kind === ChainIconKind.Logo && style != null) return String(style)
	return ''
}

function isDefaultIcon(kind: ChainIconKind, style?: ChainIconStyle): boolean {
	return kind === ChainIconKind.Logo && style == null
}

export type TestnetIconReuse = {
	testnetId: ChainId
	mainnetId: ChainId
}

export const chainIconItems: readonly ChainIconItem[] = [
	/** Unichain: unichain.org/assets/zip/unichain-brand-kit.zip (official brand kit; icon, lockup, vertical lockup) */
	{
		chainId: ChainId.Unichain,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Network icons/Mainnet.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Icon - Dark.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Icon - Light.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Vibrant,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Icon - Vibrant.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Lockup - Dark.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Lockup - Light.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Vibrant,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Lockup - Vibrant.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.VerticalLight,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Vertical  Lockup - Light.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.VerticalDark,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Vertical Lockup - Dark.svg',
		},
	},
	{
		chainId: ChainId.Unichain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.VerticalVibrant,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Vertical Lockup - Vibrant.svg',
		},
	},
	/** Plume: docs.plumenetwork.xyz/plume/community-and-support/brand-assets (GitBook SVG zip) */
	{
		chainId: ChainId.Plume,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark Red.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark Dark.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark White.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Full Logo.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Black,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Full Logo Black.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Full Logo White.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.RedBg,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark-BG-Red.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.BlackBg,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark-BG-Black.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.PoweredBy,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Powered by Plume.svg',
		},
	},
	{
		chainId: ChainId.Plume,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Inverted,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Powered by Plume Inverted.svg',
		},
	},
	/** Ink: docs.inkonchain.com (official brand kit; PNG only — symbol + full logo + safe-margin variants) */
	{
		chainId: ChainId.Ink,
		fetch: {
			fetchType: 'png',
			url: 'https://docs.inkonchain.com/images/brand-kit/docs-logo-symbol.png',
		},
	},
	{
		chainId: ChainId.Ink,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SafeMargin,
		fetch: {
			fetchType: 'png',
			url: 'https://docs.inkonchain.com/images/brand-kit/docs-logo-symbol-margin.png',
		},
	},
	{
		chainId: ChainId.Ink,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'png',
			url: 'https://docs.inkonchain.com/images/brand-kit/docs-logo-wordmark.png',
		},
	},
	{
		chainId: ChainId.Ink,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.SafeMargin,
		fetch: {
			fetchType: 'png',
			url: 'https://docs.inkonchain.com/images/brand-kit/docs-logo-wordmark-margin.png',
		},
	},
	/** Ethereum: ethereum.org/assets (Brand assets); chain logo/light from etherscan.io (explorer) */
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-glyph.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://etherscan.io/images/svg/brands/ethereum-original.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://etherscan.io/images/svg/brands/ethereum-original-light.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Black,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Purple,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-purple.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-purple-white.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Rainbow,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-rainbow.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Colored,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-glyph-colored.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Gray,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black-gray.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.PurplePurple,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-purple-purple.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.BlackWhite,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black-white.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Purple,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-purple-purple.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-purple-white.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Gray,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-black-gray.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Purple,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-purple.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-purple-white.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.LandscapeBlack,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.LandscapePurple,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-purple.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Gray,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-black-gray.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.LandscapeGray,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-black-gray.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.PortraitPurplePurple,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-purple-purple.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.LandscapePurplePurple,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-purple-purple.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-purple-white.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-glyph.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-purple-white.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-purple-white.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-black.svg',
		},
	},
	{
		chainId: ChainId.Ethereum,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-black.svg',
		},
	},
	/** Optimism: CDN from optimism.io/brand (OP Mainnet = chain logo; wordmark + avatar as variants) */
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://framerusercontent.com/images/Bhk5XtyRGAW86jJoFWQYE0wcWzI.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://framerusercontent.com/assets/4C7aevn7I1NA7W6ELgvkKvSKnOM.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Avatar,
		fetch: {
			fetchType: 'url',
			url: 'https://framerusercontent.com/assets/Z4dQJAxQCRUaDha5xN1AoF95g.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.ChainLight,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Optimism,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** XDC: xinfin.org/brand-assets (official); chain dim/dark from xdcscan.com (explorer) */
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://xinfin.org/assets/images/brand-assets/primary-icon.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://xinfin.org/assets/images/brand-assets/primary-logo.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.MonotoneBlack,
		fetch: {
			fetchType: 'url',
			url: 'https://xinfin.org/assets/images/brand-assets/monotone-black-icon.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.MonotoneWhite,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcf.cdn.prismic.io/xdcf/aCJ1SydWJ-7kR-bx_XDCIconWhiteMonoLogo.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://xinfin.org/assets/images/brand-assets/inverted-primary-logo.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.ChainLight,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://xinfin.org/assets/images/brand-assets/inverted-primary-icon.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://xinfin.org/assets/images/brand-assets/primary-logo.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/wordmark-light.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.MonotoneBlack,
		fetch: {
			fetchType: 'url',
			url: 'https://xinfin.org/assets/images/brand-assets/monotone-black-logo.svg',
		},
	},
	{
		chainId: ChainId.XDC,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.MonotoneWhite,
		fetch: {
			fetchType: 'url',
			url: 'https://xdcf.cdn.prismic.io/xdcf/aCHgyidWJ-7kR7Tu_XDCPrimaryWhiteMonoLogo.svg',
		},
	},
	/** Polygon: CDN from polygon.technology/brandguidelines; GitHub 0xPolygon/polygon-token-assets assets/brandAssets (icon black/white/gradient, logo primary/monochrome, circle/square black-bg/white-bg); chain light/dim/dark + symbol/symbol-light + full logo + circle/circle-dark/circle-light/wordmark from polygonscan.com/brandassets (explorer) */
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://cdn.prod.website-files.com/637359c81e22b715cec245ad/64db31746dec8ad339c4a315_logo-light-mode.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://cdn.prod.website-files.com/637359c81e22b715cec245ad/66273f100889f2489acb2d8e_Polygon%20Logo%20Complete%20White.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Black,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_black_on_transparent.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Inverted,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_white_on_transparent.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Colored,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_gradient_on_transparent.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Colored,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_logo_primary.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.MonotoneBlack,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_logo_monochrome_black.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.MonotoneWhite,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_logo_monochrome_white.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_logo_primary_white_wordmark.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleBlackBg,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_white_on_black_circle.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleWhiteBg,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_gradient_on_white_circle.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SquareBlackBg,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_white_on_black_square.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SquareWhiteBg,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_gradient_on_white_square.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Polygon,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** ZKsync: zksync.io/brand (default + ZIP full logo); dark/light symbol from docs.zksync.io */
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://www.zksync.io/zksync-logo.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://docs.zksync.io/logos/zksync_logo_dark.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://docs.zksync.io/logos/zksync_logo_light.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/images/icons/zksync-arrows.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.zksync.io/ZKsync-Brand.zip',
			pathInZip: 'ZKsync-Brand/Logo-Primary/ZKsync-Logo-darksvg.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.zksync.io/ZKsync-Brand.zip',
			pathInZip: 'ZKsync-Brand/Logo-Primary/ZKsync-Logo-whitesvg.svg',
		},
	},
	/** ZKsync slogan assets: zksync.io/brand → ZKsync-Slogan.zip (slogan with/without bg, light/dark) */
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Slogan,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan without bg/slogan-no-bg-light.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.SloganDark,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan without bg/slogan-no-bg-dark.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.SloganBgLight,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan with bg/slogan-bg-light.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.SloganBgDark,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan with bg/slogan-dark.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.SloganBg1,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan with bg/slogan-bg-1-logo.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.SloganBg2,
		fetch: {
			fetchType: 'zip',
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan with bg/slogan-bg-2-logo.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.ZkSyncEra,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Sei: CDN from docs.sei.io/learn/general-brand-kit (symbol, full logo); chain light/dim/dark from seiscan.io (explorer) */
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://cdn.sei.io/sei.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://docs.sei.io/assets/sei-brand-assets/sei_red_and_white.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Colored,
		fetch: {
			fetchType: 'url',
			url: 'https://docs.sei.io/assets/sei-brand-assets/sei_red_symbol.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://docs.sei.io/assets/sei-brand-assets/sei_red_and_white.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Sei,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Avalanche: CDN from shop.avax.network (official horizontal red); chain light/dim/dark + full logo/symbol/symbol-light + logo-and-wordmark light/dark/logo + circle/circle-dark/circle-light/wordmark from snowscan.xyz (explorer) */
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://cdn.shopify.com/s/files/1/0655/7260/2081/files/AVAX_Horizontal_Red.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://cdn.shopify.com/s/files/1/0655/7260/2081/files/AVAX_Horizontal_Red.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Avalanche,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Base: github.com/base/brand-kit (base.org/brand), logo/TheSquare/Digital */
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/TheSquare/Digital/Base_square_blue.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/TheSquare/Digital/Base_square_white.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Black,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/TheSquare/Digital/Base_square_black.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Logotype/Digital/Base_lockup_black.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Logotype/Digital/Base_lockup_white.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Colored,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Logotype/Digital/Base_lockup_2color.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Basemark,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Basemark/Digital/Base_basemark_blue.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.BasemarkWhite,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Basemark/Digital/Base_basemark_white.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.BasemarkBlack,
		fetch: {
			fetchType: 'url',
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Basemark/Digital/Base_basemark_black.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Base,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://basescan.org/assets/base/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Linea: linea.build (logomark/logotype); lineascan.build/brandassets (chain light/dim/dark, full logo, symbol-light) */
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://linea.build/_next/static/media/logomark.1510dc60.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://linea.build/_next/static/media/logotype.ba0f8bdc.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Linea official brand ZIP: linea.build/assets → Linea-Brand-Assets.zip (Logomark + Wordmark SVG variants) */
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Black,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark Black.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark White.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark Black.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark White.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.YellowBg,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark Yellow BG.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.BlueBg,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark Blue BG.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.WhiteBg,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark white BG.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.YellowBg,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark Yellow BG.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.BlueBg,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark Blue BG.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.WhiteBg,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark White BG.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.TokenRound,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Token/Linea-Token_Round.svg',
		},
	},
	{
		chainId: ChainId.Linea,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.TokenSquare,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Token/Linea-Token_Square.svg',
		},
	},
	/** Sonic: sonicscan.org/brandassets (explorer; chain light/dim/dark + symbol, full logo; no direct SVG on official soniclabs.com) */
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.ChainLight,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Sonic,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Monad: monadscan.com (explorer; chain light/dim/dark + symbol, full logo; official monad.xyz/brand-and-media-kit is Figma/ZIP only) */
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.ChainLight,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Monad,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** World Chain: world.org/brand (Prismic CDN lockup, wordmark, logomark); dim/dark from worldscan.org (explorer) */
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://world.org/icons/worldcoin-orb-world-logo.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEuxsAHJWomb_3_fulllogo-1.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEuxsAHJWomb_3_fulllogo-1.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEwxsAHJWomb_5_fulllogo-2.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEfBsAHJWomb_n_wordmark-1.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEgxsAHJWomb_q_wordmark-2.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.LogomarkDark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEWBsAHJWomb_i_logomark-1.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.LogomarkLight,
		fetch: {
			fetchType: 'url',
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEYBsAHJWomb_k_logomark-2.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/wordmark-light.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.WorldChain,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-light.svg',
		},
	},
	/** Celo: celoscan.io/brandassets (explorer; chain light/dim/dark + symbol, full logo; official celo.org/brand-kit is Drive/ZIP only) */
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.ChainLight,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Celo,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Arbitrum: arbitrum.io (arb_logo_color, assets/arbitrum/logo_color, brandkit/icon_white); default/symbol/light/chain-light/dim/dark from arbiscan.io (explorer; chain light/dim/dark + full logo) */
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://arbitrum.io/arb_logo_color.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Colored,
		fetch: {
			fetchType: 'url',
			url: 'https://arbitrum.io/assets/arbitrum/logo_color.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://arbitrum.io/brandkit/icon_white.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.ChainLight,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Alt,
		fetch: {
			fetchType: 'url',
			url: 'https://www.arbitrumhub.io/brandAndPress/brand.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.Arbitrum,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Codex: docs.codex.xyz (Astro); codex.io/press-kit CDN (colour + monochrome SVG); ZIP from GitHub (LogoAndWordmark chartreuse bg) */
	{
		chainId: ChainId.Codex,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://docs.codex.xyz/_astro/codex-dark-full-logo.IOPtxPup.svg',
		},
	},
	{
		chainId: ChainId.Codex,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.White,
		fetch: {
			fetchType: 'url',
			url: 'https://docs.codex.xyz/_astro/codex-white-full-logo.CI7DkyOz.svg',
		},
	},
	{
		chainId: ChainId.Codex,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Colored,
		fetch: {
			fetchType: 'url',
			url: 'https://cdn.prod.website-files.com/6669befdbe2926bfc0a8363a/667ed94e03b6f717805e8363_Logo-pack-colour.svg',
		},
	},
	{
		chainId: ChainId.Codex,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.MonotoneBlack,
		fetch: {
			fetchType: 'url',
			url: 'https://cdn.prod.website-files.com/6669befdbe2926bfc0a8363a/667ed94e9a8f19f44946fdee_Logo-pack-bw.svg',
		},
	},
	{
		chainId: ChainId.Codex,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'zip',
			zipUrl:
				'https://cdn.jsdelivr.net/gh/MadeByKin/codex/codex%20brand%20assets%20%E2%80%94%20color.zip',
			pathInZip:
				'codex brand assets \u00e2\u0080\u0094 color/codex logo black, chartreuse bg.svg',
		},
	},
	/** Arc Testnet: CDN from Alchemy (default icon); official Arc brand at arc.link/newsroom/brand-assets (PNG — Powered by ARC dark/light/colored/alt) */
	{
		chainId: ChainId.ArcTestnet,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://static.alchemyapi.io/images/emblems/arc-testnet.svg',
		},
	},
	{
		chainId: ChainId.ArcTestnet,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'png',
			url: 'https://arc-prd.s3.us-east-2.amazonaws.com/storage/static/logos/1.png',
		},
	},
	{
		chainId: ChainId.ArcTestnet,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'png',
			url: 'https://arc-prd.s3.us-east-2.amazonaws.com/storage/static/logos/2.png',
		},
	},
	{
		chainId: ChainId.ArcTestnet,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Colored,
		fetch: {
			fetchType: 'png',
			url: 'https://arc-prd.s3.us-east-2.amazonaws.com/storage/static/logos/3.png',
		},
	},
	{
		chainId: ChainId.ArcTestnet,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Alt,
		fetch: {
			fetchType: 'png',
			url: 'https://arc-prd.s3.us-east-2.amazonaws.com/storage/static/logos/6.png',
		},
	},
	/** HyperEVM: hyperevmscan.io/brandassets (explorer; chain light/dim/dark + full logo, symbol, logo-light, symbol-light) */
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/logos/chain-light.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Logo,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Symbol,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dim,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/logos/chain-dim.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/logos/chain-dark.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.LogoAndWordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.LogoAndWordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolDark,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.Circle,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleDark,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.CircleLight,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Wordmark,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Dark,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Wordmark,
		style: ChainIconStyle.Light,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/wordmark-light.svg',
		},
	},
	{
		chainId: ChainId.HyperEVM,
		kind: ChainIconKind.Logo,
		style: ChainIconStyle.SymbolLight,
		fetch: {
			fetchType: 'url',
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
] as const satisfies readonly ChainIconItem[]

export const testnetIconReuse = [
	{ testnetId: ChainId.XDCApothem, mainnetId: ChainId.XDC },
	{ testnetId: ChainId.UnichainSepolia, mainnetId: ChainId.Unichain },
	{ testnetId: ChainId.PolygonAmoy, mainnetId: ChainId.Polygon },
	{ testnetId: ChainId.MonadTestnet, mainnetId: ChainId.Monad },
	{ testnetId: ChainId.SonicTestnet, mainnetId: ChainId.Sonic },
	{ testnetId: ChainId.ZkSyncEraSepolia, mainnetId: ChainId.ZkSyncEra },
	{ testnetId: ChainId.WorldChainSepolia, mainnetId: ChainId.WorldChain },
	{ testnetId: ChainId.HyperEVMTestnet, mainnetId: ChainId.HyperEVM },
	{ testnetId: ChainId.SeiTestnet, mainnetId: ChainId.Sei },
	{ testnetId: ChainId.ArbitrumSepolia, mainnetId: ChainId.Arbitrum },
	{ testnetId: ChainId.CeloSepolia, mainnetId: ChainId.Celo },
	{ testnetId: ChainId.AvalancheFuji, mainnetId: ChainId.Avalanche },
	{ testnetId: ChainId.BaseSepolia, mainnetId: ChainId.Base },
	{ testnetId: ChainId.LineaSepolia, mainnetId: ChainId.Linea },
	{ testnetId: ChainId.InkTestnet, mainnetId: ChainId.Ink },
	{ testnetId: ChainId.CodexTestnet, mainnetId: ChainId.Codex },
	{ testnetId: ChainId.PlumeTestnet, mainnetId: ChainId.Plume },
	{ testnetId: ChainId.EthereumSepolia, mainnetId: ChainId.Ethereum },
	{ testnetId: ChainId.OPSepolia, mainnetId: ChainId.Optimism },
] as const satisfies readonly TestnetIconReuse[]

function isSvgContent(text: string): boolean {
	const t = text.trim()
	return (
		t.startsWith('<?xml') ||
		t.startsWith('<svg') ||
		(t.startsWith('<!--') && t.includes('<svg'))
	)
}

async function fetchSvg(url: string): Promise<string> {
	const res = await fetch(url, {
		headers: { Accept: 'image/svg+xml' },
		redirect: 'follow',
	})
	if (!res.ok) throw new Error(`${url} ${res.status}`)
	const text = await res.text()
	if (!isSvgContent(text)) throw new Error(`${url} returned non-SVG content`)
	return text
}

function pngToSvgWrapper(pngBase64: string, size = 256): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><image width="${size}" height="${size}" href="data:image/png;base64,${pngBase64}"/></svg>`
}

async function main() {
	const written = new Set<string>()
	const defaultSvgByChainId = new Map<number, string>()
	const zipCache = new Map<string, Record<string, Uint8Array>>()
	for (const { chainId, kind, style, fetch: f } of chainIconItems) {
		const id = Number(chainId)
		const iconKind = kind ?? ChainIconKind.Logo
		try {
			if (f.fetchType === 'zip') {
				let unzipped = zipCache.get(f.zipUrl)
				if (!unzipped) {
					const res = await fetch(f.zipUrl, { redirect: 'follow' })
					if (!res.ok) throw new Error(`${f.zipUrl} ${res.status}`)
					const buf = await res.arrayBuffer()
					unzipped = unzipSync(new Uint8Array(buf)) as Record<
						string,
						Uint8Array
					>
					zipCache.set(f.zipUrl, unzipped)
				}
				const entry = unzipped[f.pathInZip]
				if (!entry) throw new Error(`missing in zip: ${f.pathInZip}`)
				const svg = new TextDecoder().decode(entry)
				const suffix = suffixFromKindStyle(iconKind, style)
				const filename = suffix ? `${id}-${suffix}.svg` : `${id}.svg`
				const path = new URL(filename, OUT_DIR)
				await Bun.write(path, svg)
				written.add(filename)
				if (isDefaultIcon(iconKind, style)) defaultSvgByChainId.set(id, svg)
				console.log(`OK ${filename} (from ZIP)`)
			} else if (f.fetchType === 'png') {
				const res = await fetch(f.url, { redirect: 'follow' })
				if (!res.ok) throw new Error(`${f.url} ${res.status}`)
				const buf = await res.arrayBuffer()
				const b64 = Buffer.from(buf).toString('base64')
				const svg = pngToSvgWrapper(b64)
				const suffix = suffixFromKindStyle(iconKind, style)
				const filename = suffix ? `${id}-${suffix}.svg` : `${id}.svg`
				const path = new URL(filename, OUT_DIR)
				await Bun.write(path, svg)
				written.add(filename)
				if (isDefaultIcon(iconKind, style)) defaultSvgByChainId.set(id, svg)
				console.log(`OK ${filename} (PNG wrapped)`)
			} else {
				const svg = await fetchSvg(f.url)
				const suffix = suffixFromKindStyle(iconKind, style)
				const filename = suffix ? `${id}-${suffix}.svg` : `${id}.svg`
				const path = new URL(filename, OUT_DIR)
				await Bun.write(path, svg)
				written.add(filename)
				if (isDefaultIcon(iconKind, style)) defaultSvgByChainId.set(id, svg)
				console.log(`OK ${filename}`)
			}
		} catch (e) {
			const suffix =
				f.fetchType === 'url' || f.fetchType === 'zip' || f.fetchType === 'png'
					? suffixFromKindStyle(iconKind, style)
					: ''
			console.warn(
				`SKIP ${id}${suffix ? `-${suffix}` : ''} (${f.fetchType}): ${e instanceof Error ? e.message : e}`,
			)
		}
	}

	for (const { testnetId, mainnetId } of testnetIconReuse) {
		const tid = Number(testnetId)
		const mid = Number(mainnetId)
		const svg = defaultSvgByChainId.get(mid)
		if (!svg) continue
		try {
			const dest = new URL(`${tid}.svg`, OUT_DIR)
			await Bun.write(dest, svg)
			written.add(`${tid}.svg`)
			console.log(`COPY ${tid}.svg <- ${mid}`)
		} catch {
			// ignore
		}
	}

	console.log(
		`Done. ${written.size} files in static/networks. Run: bun run icons:optimize`,
	)
}

main()
