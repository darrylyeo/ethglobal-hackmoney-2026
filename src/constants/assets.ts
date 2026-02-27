/**
 * Asset (icon) fetch schema and sources for chains, coins, brands.
 * All sources and discovery documentation in one place per spec 052.
 * Structure follows spec 045: enums, types, canonical arrays only; no helper functions.
 *
 * Discovery: chains → chain registries, official brand kits; coins → token lists, official
 * assets (ethereum.org, circle.com), Wikimedia; brands → official kits, Simple Icons,
 * VectorLogo.zone. Document each source in comments; fetch URL is source of truth.
 * Sync: run scripts/_sync-assets.ts to download/unpack/optimize only sources not yet synced.
 * Format helpers (assetSuffix, isDefaultAsset, assetFilename) live in src/lib/assetUtils.ts.
 */

import { ChainId } from './networks.ts'

export enum AssetSubject {
	Network = 'Network',
	Coin = 'Coin',
	Brand = 'Brand',
}

export enum AssetKind {
	Logo = 'Logo',
	Wordmark = 'Wordmark',
	LogoAndWordmark = 'LogoAndWordmark',
}

export type AssetStyle = string

export enum FetchTypeKind {
	Zip = 'Zip',
	Png = 'Png',
	Url = 'Url',
}

export type FetchType =
	| { fetchType: FetchTypeKind.Zip; zipUrl: string; pathInZip: string }
	| { fetchType: FetchTypeKind.Png; url: string }
	| { fetchType: FetchTypeKind.Url; url: string }

export type AssetSource = {
	subject: AssetSubject
	id: string | number
	kind?: AssetKind
	style?: AssetStyle
	fetch: FetchType
}

export type AssetAlias = {
	subject: AssetSubject
	fromId: string | number
	toId: string | number
}

/** Chain asset sources. IDs = ChainId from networks.ts. */
export const chainAssetSources = [
	/** Unichain: unichain.org/assets/zip/unichain-brand-kit.zip (official brand kit; icon, lockup, vertical lockup) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Network icons/Mainnet.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Icon - Dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Icon - Light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.Logo,
		style: 'vibrant',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Icon - Vibrant.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Lockup - Dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Lockup - Light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.LogoAndWordmark,
		style: 'vibrant',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Lockup - Vibrant.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.LogoAndWordmark,
		style: 'vertical-light',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Vertical  Lockup - Light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.LogoAndWordmark,
		style: 'vertical-dark',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Vertical Lockup - Dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Unichain,
		kind: AssetKind.LogoAndWordmark,
		style: 'vertical-vibrant',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.unichain.org/assets/zip/unichain-brand-kit.zip',
			pathInZip:
				'Unichain Brand Kit /Unichain Logo Assets/Unichain Vertical Lockup - Vibrant.svg',
		},
	},
	/** Plume: docs.plumenetwork.xyz/plume/community-and-support/brand-assets (GitBook SVG zip) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark Red.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark Dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.Logo,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark White.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Full Logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.LogoAndWordmark,
		style: 'black',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Full Logo Black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.LogoAndWordmark,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Full Logo White.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.Logo,
		style: 'red-bg',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark-BG-Red.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.Logo,
		style: 'black-bg',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Logomark-BG-Black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.LogoAndWordmark,
		style: 'powered-by',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Powered by Plume.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Plume,
		kind: AssetKind.LogoAndWordmark,
		style: 'inverted',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://4283780171-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FcaO8bqNQ5CJfDyLKmEZF%2Fuploads%2FhACgnZH9YAp6HsArymxz%2FPlume%20Media%20Kit%20-%20SVG.zip?alt=media&token=801bc6e8-cf27-4c9b-8141-935a6e2b663f',
			pathInZip: 'Powered by Plume Inverted.svg',
		},
	},
	/** Ink: docs.inkonchain.com (official brand kit; PNG only — symbol + full logo + safe-margin variants) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Ink,
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://docs.inkonchain.com/images/brand-kit/docs-logo-symbol.png',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ink,
		kind: AssetKind.Logo,
		style: 'safe-margin',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://docs.inkonchain.com/images/brand-kit/docs-logo-symbol-margin.png',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ink,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://docs.inkonchain.com/images/brand-kit/docs-logo-wordmark.png',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ink,
		kind: AssetKind.LogoAndWordmark,
		style: 'safe-margin',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://docs.inkonchain.com/images/brand-kit/docs-logo-wordmark-margin.png',
		},
	},
	/** Ethereum: ethereum.org/assets (Brand assets); chain logo/light from etherscan.io (explorer) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-glyph.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://etherscan.io/images/svg/brands/ethereum-original.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://etherscan.io/images/svg/brands/ethereum-original-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'purple',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-purple.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-purple-white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'rainbow',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-rainbow.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-glyph-colored.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'gray',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black-gray.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'purple-purple',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-purple-purple.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'black-white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black-white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Wordmark,
		style: 'purple',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-purple-purple.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Wordmark,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-purple-white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Wordmark,
		style: 'gray',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-black-gray.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'purple',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-purple.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-purple-white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'landscape-black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'landscape-purple',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-purple.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'gray',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-black-gray.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'landscape-gray',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-black-gray.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'portrait-purple-purple',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-purple-purple.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'landscape-purple-purple',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-purple-purple.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-landscape-purple-white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-glyph.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-purple-white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-purple-white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.LogoAndWordmark,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-logo-portrait-black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Ethereum,
		kind: AssetKind.Wordmark,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/ethereum-wordmark-black.svg',
		},
	},
	/** Optimism: CDN from optimism.io/brand (OP Mainnet = chain logo; wordmark + avatar as variants) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://framerusercontent.com/images/Bhk5XtyRGAW86jJoFWQYE0wcWzI.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://framerusercontent.com/assets/4C7aevn7I1NA7W6ELgvkKvSKnOM.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'avatar',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://framerusercontent.com/assets/Z4dQJAxQCRUaDha5xN1AoF95g.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'chain-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Optimism,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://optimistic.etherscan.io/assets/optimism/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** XDC: xinfin.org/brand-assets (official); chain dim/dark from xdcscan.com (explorer) */
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xinfin.org/assets/images/brand-assets/primary-icon.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xinfin.org/assets/images/brand-assets/primary-logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'monotone-black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xinfin.org/assets/images/brand-assets/monotone-black-icon.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'monotone-white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcf.cdn.prismic.io/xdcf/aCJ1SydWJ-7kR-bx_XDCIconWhiteMonoLogo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xinfin.org/assets/images/brand-assets/inverted-primary-logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'chain-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xinfin.org/assets/images/brand-assets/inverted-primary-icon.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xinfin.org/assets/images/brand-assets/primary-logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.LogoAndWordmark,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcscan.com/assets/xdc/images/svg/brandassets/wordmark-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.LogoAndWordmark,
		style: 'monotone-black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xinfin.org/assets/images/brand-assets/monotone-black-logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.XDC,
		kind: AssetKind.LogoAndWordmark,
		style: 'monotone-white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://xdcf.cdn.prismic.io/xdcf/aCHgyidWJ-7kR7Tu_XDCPrimaryWhiteMonoLogo.svg',
		},
	},
	/** Polygon: CDN from polygon.technology/brandguidelines; GitHub 0xPolygon/polygon-token-assets assets/brandAssets (icon black/white/gradient, logo primary/monochrome, circle/square black-bg/white-bg); chain light/dim/dark + symbol/symbol-light + full logo + circle/circle-dark/circle-light/wordmark from polygonscan.com/brandassets (explorer) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.prod.website-files.com/637359c81e22b715cec245ad/64db31746dec8ad339c4a315_logo-light-mode.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.prod.website-files.com/637359c81e22b715cec245ad/66273f100889f2489acb2d8e_Polygon%20Logo%20Complete%20White.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_black_on_transparent.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'inverted',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_white_on_transparent.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_gradient_on_transparent.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.LogoAndWordmark,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_logo_primary.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.LogoAndWordmark,
		style: 'monotone-black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_logo_monochrome_black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.LogoAndWordmark,
		style: 'monotone-white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_logo_monochrome_white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.LogoAndWordmark,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_logo_primary_white_wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'circle-black-bg',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_white_on_black_circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'circle-white-bg',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_gradient_on_white_circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'square-black-bg',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_white_on_black_square.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Logo,
		style: 'square-white-bg',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/main/assets/brandAssets/polygon_icon_gradient_on_white_square.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Polygon,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://polygonscan.com/assets/poly/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** ZKsync: zksync.io/brand (default + ZIP full logo); dark/light symbol from docs.zksync.io */
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://www.zksync.io/zksync-logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.zksync.io/logos/zksync_logo_dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.zksync.io/logos/zksync_logo_light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/images/icons/zksync-arrows.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.zksync.io/ZKsync-Brand.zip',
			pathInZip: 'ZKsync-Brand/Logo-Primary/ZKsync-Logo-darksvg.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.zksync.io/ZKsync-Brand.zip',
			pathInZip: 'ZKsync-Brand/Logo-Primary/ZKsync-Logo-whitesvg.svg',
		},
	},
	/** ZKsync slogan assets: zksync.io/brand → ZKsync-Slogan.zip (slogan with/without bg, light/dark) */
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'slogan',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan without bg/slogan-no-bg-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'slogan-dark',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan without bg/slogan-no-bg-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'slogan-bg-light',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan with bg/slogan-bg-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'slogan-bg-dark',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan with bg/slogan-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'slogan-bg-1',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan with bg/slogan-bg-1-logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'slogan-bg-2',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl: 'https://www.zksync.io/ZKsync-Slogan.zip',
			pathInZip: 'zksync-slogan/slogan with bg/slogan-bg-2-logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ZkSyncEra,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://explorer.zksync.io/assets/zksync/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Sei: CDN from docs.sei.io/learn/general-brand-kit (symbol, full logo); chain light/dim/dark from seiscan.io (explorer) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.sei.io/sei.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.sei.io/assets/sei-brand-assets/sei_red_and_white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.sei.io/assets/sei-brand-assets/sei_red_symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.sei.io/assets/sei-brand-assets/sei_red_and_white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.LogoAndWordmark,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sei,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://seiscan.io/assets/sei/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Avalanche: CDN from shop.avax.network (official horizontal red); chain light/dim/dark + full logo/symbol/symbol-light + logo-and-wordmark light/dark/logo + circle/circle-dark/circle-light/wordmark from snowscan.xyz (explorer) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.shopify.com/s/files/1/0655/7260/2081/files/AVAX_Horizontal_Red.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.shopify.com/s/files/1/0655/7260/2081/files/AVAX_Horizontal_Red.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.LogoAndWordmark,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Avalanche,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://snowscan.xyz/assets/avax/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Base: github.com/base/brand-kit (base.org/brand), logo/TheSquare/Digital */
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/TheSquare/Digital/Base_square_blue.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/TheSquare/Digital/Base_square_white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/TheSquare/Digital/Base_square_black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Logotype/Digital/Base_lockup_black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.LogoAndWordmark,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Logotype/Digital/Base_lockup_white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.LogoAndWordmark,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Logotype/Digital/Base_lockup_2color.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'basemark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Basemark/Digital/Base_basemark_blue.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'basemark-white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Basemark/Digital/Base_basemark_white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'basemark-black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/base/brand-kit/main/logo/Basemark/Digital/Base_basemark_black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.LogoAndWordmark,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Base,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://basescan.org/assets/base/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Linea: linea.build (logomark/logotype); lineascan.build/brandassets (chain light/dim/dark, full logo, symbol-light) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://linea.build/_next/static/media/logomark.1510dc60.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://linea.build/_next/static/media/logotype.ba0f8bdc.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://lineascan.build/assets/linea/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Linea official brand ZIP: linea.build/assets → Linea-Brand-Assets.zip (Logomark + Wordmark SVG variants) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'black',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark Black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark White.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark Black.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Wordmark,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark White.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'yellow-bg',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark Yellow BG.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'blue-bg',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark Blue BG.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'white-bg',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Logomark white BG.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Wordmark,
		style: 'yellow-bg',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark Yellow BG.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Wordmark,
		style: 'blue-bg',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark Blue BG.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Wordmark,
		style: 'white-bg',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Logo/SVG/Wordmark White BG.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'token-round',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Token/Linea-Token_Round.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Linea,
		kind: AssetKind.Logo,
		style: 'token-square',
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://assets.ctfassets.net/64upluvbiuck/46y5rC2mj5Ocekur7vMSdP/c972526b87afa927a2e0bf2f506e8f75/Linea-Brand-Assets.zip',
			pathInZip: 'Linea-Brand-Assets/Token/Linea-Token_Square.svg',
		},
	},
	/** Sonic: sonicscan.org/brandassets (explorer; chain light/dim/dark + symbol, full logo; no direct SVG on official soniclabs.com) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'chain-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Sonic,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://sonicscan.org/assets/sonic/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Monad: monadscan.com (explorer; chain light/dim/dark + symbol, full logo; official monad.xyz/brand-and-media-kit is Figma/ZIP only) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'chain-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Monad,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://monadscan.com/assets/monad/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** World Chain: world.org/brand (Prismic CDN lockup, wordmark, logomark); dim/dark from worldscan.org (explorer) */
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://world.org/icons/worldcoin-orb-world-logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEuxsAHJWomb_3_fulllogo-1.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEuxsAHJWomb_3_fulllogo-1.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.LogoAndWordmark,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEwxsAHJWomb_5_fulllogo-2.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEfBsAHJWomb_n_wordmark-1.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEgxsAHJWomb_q_wordmark-2.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'logomark-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEWBsAHJWomb_i_logomark-1.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'logomark-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/Z9GEYBsAHJWomb_k_logomark-2.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/wordmark-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.WorldChain,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://worldscan.org/assets/world/images/svg/brandassets/logo-light.svg',
		},
	},
	/** Celo: celoscan.io/brandassets (explorer; chain light/dim/dark + symbol, full logo; official celo.org/brand-kit is Drive/ZIP only) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'chain-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Celo,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://celoscan.io/assets/celo/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Arbitrum: arbitrum.io (arb_logo_color, assets/arbitrum/logo_color, brandkit/icon_white); default/symbol/light/chain-light/dim/dark from arbiscan.io (explorer; chain light/dim/dark + full logo) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbitrum.io/arb_logo_color.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbitrum.io/assets/arbitrum/logo_color.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbitrum.io/brandkit/icon_white.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'chain-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.LogoAndWordmark,
		style: 'alt',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://www.arbitrumhub.io/brandAndPress/brand.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Arbitrum,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://arbiscan.io/assets/arbitrum/images/svg/brandassets/wordmark-light.svg',
		},
	},
	/** Codex: docs.codex.xyz (Astro); codex.io/press-kit CDN (colour + monochrome SVG); ZIP from GitHub (LogoAndWordmark chartreuse bg) */
	{
		subject: AssetSubject.Network,
		id: ChainId.Codex,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.codex.xyz/_astro/codex-dark-full-logo.IOPtxPup.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Codex,
		kind: AssetKind.Logo,
		style: 'white',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.codex.xyz/_astro/codex-white-full-logo.CI7DkyOz.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Codex,
		kind: AssetKind.Logo,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.prod.website-files.com/6669befdbe2926bfc0a8363a/667ed94e03b6f717805e8363_Logo-pack-colour.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Codex,
		kind: AssetKind.Logo,
		style: 'monotone-black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.prod.website-files.com/6669befdbe2926bfc0a8363a/667ed94e9a8f19f44946fdee_Logo-pack-bw.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.Codex,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Zip,
			zipUrl:
				'https://cdn.jsdelivr.net/gh/MadeByKin/codex/codex%20brand%20assets%20%E2%80%94%20color.zip',
			pathInZip:
				'codex brand assets \u00e2\u0080\u0094 color/codex logo black, chartreuse bg.svg',
		},
	},
	/** Arc Testnet: CDN from Alchemy (default icon); official Arc brand at arc.link/newsroom/brand-assets (PNG — Powered by ARC dark/light/colored/alt) */
	{
		subject: AssetSubject.Network,
		id: ChainId.ArcTestnet,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://static.alchemyapi.io/images/emblems/arc-testnet.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ArcTestnet,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://arc-prd.s3.us-east-2.amazonaws.com/storage/static/logos/1.png',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ArcTestnet,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://arc-prd.s3.us-east-2.amazonaws.com/storage/static/logos/2.png',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ArcTestnet,
		kind: AssetKind.LogoAndWordmark,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://arc-prd.s3.us-east-2.amazonaws.com/storage/static/logos/3.png',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.ArcTestnet,
		kind: AssetKind.LogoAndWordmark,
		style: 'alt',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://arc-prd.s3.us-east-2.amazonaws.com/storage/static/logos/6.png',
		},
	},
	/** HyperEVM: hyperevmscan.io/brandassets (explorer; chain light/dim/dark + full logo, symbol, logo-light, symbol-light) */
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/logos/chain-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'logo',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'symbol',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-symbol.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'dim',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/logos/chain-dim.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/logos/chain-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.LogoAndWordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.LogoAndWordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.LogoAndWordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'symbol-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-symbol-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-circle.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'circle-dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-circle-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'circle-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-circle-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Wordmark,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/wordmark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Wordmark,
		style: 'dark',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/wordmark-dark.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Wordmark,
		style: 'light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/wordmark-light.svg',
		},
	},
	{
		subject: AssetSubject.Network,
		id: ChainId.HyperEVM,
		kind: AssetKind.Logo,
		style: 'symbol-light',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://hyperevmscan.io/assets/hype/images/svg/brandassets/logo-symbol-light.svg',
		},
	},
] as const satisfies readonly AssetSource[]

/** Testnet reuse mainnet default icon. */
export const chainAssetAliases = [
	{ subject: AssetSubject.Network, fromId: ChainId.XDCApothem, toId: ChainId.XDC },
	{
		subject: AssetSubject.Network,
		fromId: ChainId.UnichainSepolia,
		toId: ChainId.Unichain,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.PolygonAmoy,
		toId: ChainId.Polygon,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.MonadTestnet,
		toId: ChainId.Monad,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.SonicTestnet,
		toId: ChainId.Sonic,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.ZkSyncEraSepolia,
		toId: ChainId.ZkSyncEra,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.WorldChainSepolia,
		toId: ChainId.WorldChain,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.HyperEVMTestnet,
		toId: ChainId.HyperEVM,
	},
	{ subject: AssetSubject.Network, fromId: ChainId.SeiTestnet, toId: ChainId.Sei },
	{
		subject: AssetSubject.Network,
		fromId: ChainId.ArbitrumSepolia,
		toId: ChainId.Arbitrum,
	},
	{ subject: AssetSubject.Network, fromId: ChainId.CeloSepolia, toId: ChainId.Celo },
	{
		subject: AssetSubject.Network,
		fromId: ChainId.AvalancheFuji,
		toId: ChainId.Avalanche,
	},
	{ subject: AssetSubject.Network, fromId: ChainId.BaseSepolia, toId: ChainId.Base },
	{
		subject: AssetSubject.Network,
		fromId: ChainId.LineaSepolia,
		toId: ChainId.Linea,
	},
	{ subject: AssetSubject.Network, fromId: ChainId.InkTestnet, toId: ChainId.Ink },
	{
		subject: AssetSubject.Network,
		fromId: ChainId.CodexTestnet,
		toId: ChainId.Codex,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.PlumeTestnet,
		toId: ChainId.Plume,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.EthereumSepolia,
		toId: ChainId.Ethereum,
	},
	{
		subject: AssetSubject.Network,
		fromId: ChainId.OPSepolia,
		toId: ChainId.Optimism,
	},
] as const satisfies readonly AssetAlias[]

/** Coin asset sources: id = lowercase symbol or token list key. Sources: token lists, official asset repos, brand kits. */
export const coinAssetSources = [
	// USDC: Circle brand (Wikimedia Commons, from circle.com; CC BY-SA 4.0)
	{
		subject: AssetSubject.Coin,
		id: 'usdc',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Circle_USDC_Logo.svg',
		},
	},
	// ETH: ethereum.org brand assets
	{
		subject: AssetSubject.Coin,
		id: 'eth',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-glyph.svg',
		},
	},
	{
		subject: AssetSubject.Coin,
		id: 'eth',
		kind: AssetKind.Logo,
		style: 'colored',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-glyph-colored.svg',
		},
	},
	{
		subject: AssetSubject.Coin,
		id: 'eth',
		kind: AssetKind.Logo,
		style: 'black',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-black.svg',
		},
	},
	{
		subject: AssetSubject.Coin,
		id: 'eth',
		kind: AssetKind.Logo,
		style: 'rainbow',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://ethereum.org/images/assets/svgs/eth-diamond-rainbow.svg',
		},
	},
	// USDT: token list (Uniswap assets)
	{
		subject: AssetSubject.Coin,
		id: 'usdt',
		fetch: {
			fetchType: FetchTypeKind.Png,
			url: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
		},
	},
] as const satisfies readonly AssetSource[]

/**
 * Provider/brand icon fetch list (Spec 052). id = lowercase filename stem → providers/{id}.svg.
 * Protocol enum mapping: UniswapV4→uniswap, LiFi→lifi, Odos→odos, KyberSwap→kyberswap,
 * Relay→relay, Yellow→yellow, Cctp→cctp, PartyKit→partykit, CircleGateway→circle.
 * Sources: blockhead (icons), official brand kits, Simple Icons, VectorLogo.zone.
 */
export const providerAssetSources = [
	/** Protocol.UniswapV4 — blockhead icons/Uniswap.svg */
	{
		subject: AssetSubject.Brand,
		id: 'uniswap',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://raw.githubusercontent.com/darrylyeo/blockhead/main/src/assets/icons/Uniswap.svg',
		},
	},
	/** Protocol.LiFi — LI.FI official branding */
	{
		subject: AssetSubject.Brand,
		id: 'lifi',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://li.fi/assets/branding/svg/logo_lifi_dark.svg',
		},
	},
	/** Protocol.Odos — Odos docs brand kit (symbol, black) */
	{
		subject: AssetSubject.Brand,
		id: 'odos',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.odos.xyz/img/BrandAssets/Odos%20Symbol%20Black.svg',
		},
	},
	/** Protocol.KyberSwap — official site logo-dark.svg */
	{
		subject: AssetSubject.Brand,
		id: 'kyberswap',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://kyberswap.com/logo-dark.svg',
		},
	},
	/** Protocol.Relay — Relay docs brand assets (relay-black.svg) */
	{
		subject: AssetSubject.Brand,
		id: 'relay',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://mintcdn.com/unevenlabs/EQZvqdUTUiQuFwvU/logo/relay-black.svg?fit=max&auto=format&n=EQZvqdUTUiQuFwvU&q=85&s=898e63b17eddfca534404ed10f80e4f6',
		},
	},
	/** Protocol.Yellow — yellow.org header logo */
	{
		subject: AssetSubject.Brand,
		id: 'yellow',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://yellow.org/images/header/yellow_logo_light.svg',
		},
	},
	/** Protocol.Cctp — Circle icon via VectorLogo.zone */
	{
		subject: AssetSubject.Brand,
		id: 'cctp',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://www.vectorlogo.zone/logos/circle/circle-icon.svg',
		},
	},
	/** Protocol.CircleGateway (Circle Gateway) — Circle icon via VectorLogo.zone */
	{
		subject: AssetSubject.Brand,
		id: 'circle',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://www.vectorlogo.zone/logos/circle/circle-icon.svg',
		},
	},
	/** Protocol.PartyKit — PartyKit docs favicon (balloon mark) */
	{
		subject: AssetSubject.Brand,
		id: 'partykit',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://docs.partykit.io/favicon.svg',
		},
	},
	/** DataSourceId.Farcaster — Simple Icons */
	{
		subject: AssetSubject.Brand,
		id: 'farcaster',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.simpleicons.org/farcaster/8B5CF6',
		},
	},
	/** DataSourceId.Covalent — Simple Icons */
	{
		subject: AssetSubject.Brand,
		id: 'covalent',
		kind: AssetKind.Logo,
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.simpleicons.org/covalent/375BD2',
		},
	},
	/** Other brands (architecture graph etc.): Simple Icons / VectorLogo.zone */
	{
		subject: AssetSubject.Brand,
		id: 'ens',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.simpleicons.org/ens/5298FF',
		},
	},
	{
		subject: AssetSubject.Brand,
		id: 'svelte',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.simpleicons.org/svelte/FF3E00',
		},
	},
	{
		subject: AssetSubject.Brand,
		id: 'tanstack',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.simpleicons.org/tanstack/FF4154',
		},
	},
	{
		subject: AssetSubject.Brand,
		id: 'deno',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.simpleicons.org/deno/000000',
		},
	},
	{
		subject: AssetSubject.Brand,
		id: 'voltaire',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.simpleicons.org/ethereum/3C3C3D',
		},
	},
	{
		subject: AssetSubject.Brand,
		id: 'threlte',
		fetch: {
			fetchType: FetchTypeKind.Url,
			url: 'https://cdn.simpleicons.org/threedotjs/000000',
		},
	},
] as const satisfies readonly AssetSource[]
