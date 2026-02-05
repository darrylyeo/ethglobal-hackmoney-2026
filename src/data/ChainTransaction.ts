import type { ChainId } from '$/constants/networks'
import type { EthLog } from '$/api/voltaire'

export type ChainTransaction$Id = {
	chainId: ChainId
	txHash: `0x${string}`
}

export type ChainTransactionEntry = {
	$id: ChainTransaction$Id
	blockNumber: number
	blockHash: string
	from: string
	to: string | null
	value: string
	logs: EthLog[]
}
