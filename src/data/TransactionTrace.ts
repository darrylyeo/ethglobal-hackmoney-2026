import type { Trace } from '$/data/Trace.ts'
import type { Network$Id } from '$/data/Network.ts'

export type TransactionTrace$Id = {
	$network: Network$Id
	txHash: `0x${string}`
}

export type TransactionTraceEntry = {
	$id: TransactionTrace$Id
	trace?: Trace
	unavailable?: boolean
}
