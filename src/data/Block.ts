import type { ChainId } from '$/constants/networks.ts'

export type Block$Id = {
	chainId: ChainId
	blockNumber: number
}

export type BlockEntry = {
	$id: Block$Id
	number: bigint
	hash?: `0x${string}`
	parentHash?: `0x${string}`
	timestamp: number
	miner?: `0x${string}`
	gasUsed?: bigint
	gasLimit?: bigint
	baseFeePerGas?: bigint
	transactionCount?: number
}
