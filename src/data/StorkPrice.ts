import type { Network$Id } from '$/data/Network.ts'

export enum StorkPriceTransport {
	Rest = 'rest',
	Websocket = 'websocket',
	Rpc = 'rpc',
}

export type StorkPrice$Id = {
	assetId: string
	transport: StorkPriceTransport
	$network?: Network$Id
}

export type StorkPrice = {
	$id: StorkPrice$Id
	assetId: string
	transport: StorkPriceTransport
	encodedAssetId: string | null
	price: bigint
	timestampNs: bigint
	updatedAt: number
	isLoading: boolean
	error: string | null
}
