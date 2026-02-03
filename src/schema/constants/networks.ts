import type {
	ChainId,
	NetworkType,
	ServiceProvider,
	TransportType,
} from '$/constants/networks'

export type Network = {
	id: ChainId
	name: string
	type: NetworkType
}

export type NetworkCurrency = {
	name: string
	symbol: string
}

export type RpcEndpoint = {
	chainId: ChainId
	url: string
	serviceProvider: ServiceProvider
	transportType: TransportType
}

export type NetworkConfig = {
	chainId: ChainId
	name: string
	type: NetworkType
	nativeCurrency: NetworkCurrency
	explorerUrl?: string
	rpcEndpoints: readonly RpcEndpoint[]
}
