import type { Network$Id } from '$/data/Network.ts'

export type Block$Id = {
	$network: Network$Id
	blockNumber: number
	hash?: `0x${string}`
}

export type BlockEntry = {
	$id: Block$Id
	number: bigint
	hash?: `0x${string}`
	parentHash?: `0x${string}`
	/** Unix time in milliseconds (normalized at collection boundary). */
	timestamp: number
	miner?: `0x${string}`
	gasUsed?: bigint
	gasLimit?: bigint
	baseFeePerGas?: bigint
	transactionCount?: number
}
