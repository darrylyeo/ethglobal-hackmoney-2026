import type {
	ChainId,
	ServiceProvider,
	TransportType,
} from '$/constants/rpc-endpoints'

export type RpcEndpoint = {
	chainId: ChainId
	url: string
	serviceProvider: ServiceProvider
	transportType: TransportType
}
