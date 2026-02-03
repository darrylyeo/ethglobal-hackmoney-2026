export type StorkPriceTransport = 'rest' | 'websocket' | 'rpc'

export type StorkPrice$Id = {
	assetId: string
	transport: StorkPriceTransport
	chainId?: number
}

export type StorkPrice = {
	$id: StorkPrice$Id
	assetId: string
	transport: StorkPriceTransport
	chainId: number | null
	encodedAssetId: string | null
	price: bigint
	timestampNs: bigint
	updatedAt: number
	isLoading: boolean
	error: string | null
}
