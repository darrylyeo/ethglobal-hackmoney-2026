import type { ChainId } from '$/constants/networks'

export type Block$Id = {
	chainId: ChainId
	blockNumber: number
}

export type BlockEntry = {
	$id: Block$Id
	number: bigint
	timestamp: number
	transactionCount?: number
}
