import type { ChainId } from '$/constants/networks.ts'
import type { EvmLog } from '$/api/voltaire.ts'

export type ChainTransaction$Id = {
	chainId: ChainId
	txHash: `0x${string}`
}

export type ChainTransactionEntry = {
	$id: ChainTransaction$Id
	blockNumber: number
	blockHash: string
	transactionIndex?: number
	from: string
	to: string | null
	value: string
	nonce?: number
	input?: string
	gas?: bigint
	gasPrice?: bigint
	type?: number
	status?: number
	gasUsed?: bigint
	contractAddress?: string | null
	effectiveGasPrice?: bigint
	logs: EvmLog[]
}
