import type { ChainId } from '$/constants/networks.ts'

export type StorkPriceTransport = 'rest' | 'websocket' | 'rpc'

export type StorkPrice$Id = {
	assetId: string
	transport: StorkPriceTransport
	chainId?: ChainId,
}

export type StorkPrice = {
	$id: StorkPrice$Id
	assetId: string
	transport: StorkPriceTransport
	chainId: ChainId | null
	encodedAssetId: string | null
	price: bigint
	timestampNs: bigint
	updatedAt: number
	isLoading: boolean
	error: string | null,
}
