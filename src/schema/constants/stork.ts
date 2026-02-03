import type {
	StorkEnvironment,
	StorkQuoteAsset,
	StorkRegion,
	StorkTokenSymbol,
	StorkTransportType,
} from '$/constants/stork'

export type StorkEndpoint = {
	region: StorkRegion
	url: string
	transportType: StorkTransportType
	environment: StorkEnvironment
}

export type StorkAssetRegistryEntry = {
	assetId: string
	encodedAssetId: string
}

export type StorkAssetDefinition = StorkAssetRegistryEntry & {
	baseAsset: string
	quoteAsset: StorkQuoteAsset
	chainIds: readonly number[]
}

export type StorkTokenSymbolEntry = {
	symbol: StorkTokenSymbol
	assetId: string
}

export type StorkPushedAsset = {
	assetId: string
	maxStalenessSeconds: number
	minDeltaPercent: number
}

export type StorkPushedAssetsByNetwork = {
	[network: string]: {
		mainnet?: StorkPushedAsset[]
		testnet?: StorkPushedAsset[]
		dognet?: StorkPushedAsset[]
	}
}
