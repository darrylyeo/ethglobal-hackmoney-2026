import type { BridgeRoutes$Id } from '$/data/BridgeRoute.ts'

export type BridgeQuoteTransactionRequest = {
	to: `0x${string}`
	data: `0x${string}`
	value?: string
	chainId: number
	gasLimit?: string
	label?: string
}

export type BridgeQuoteItem = {
	$id: string
	request: BridgeRoutes$Id
	success: boolean
	transactionRequests: BridgeQuoteTransactionRequest[]
	fetchedAt: number
	error: string | null
}
