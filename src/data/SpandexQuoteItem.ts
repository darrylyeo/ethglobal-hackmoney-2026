/**
 * Normalized per-provider spandex quote row for TanStack DB.
 * Used to cache multi-provider results and flag quote vs simulation mismatches.
 */

export type SpandexQuoteRequestId = {
	chainId: number
	inputToken: `0x${string}`
	outputToken: `0x${string}`
	amountIn: bigint
	slippageBps: number
	swapperAccount: `0x${string}`
}

export type SpandexQuoteTransactionRequest = {
	to: `0x${string}`
	data: `0x${string}`
	value: string
	chainId: number
	gasLimit?: string
}

export type SpandexQuoteItem = {
	$id: { requestId: string; provider: string }
	requestId: SpandexQuoteRequestId
	provider: string
	success: boolean
	quotedOutputAmount: bigint
	simulatedOutputAmount: bigint | null
	gasUsed: bigint | null
	/** Basis points: quoted vs simulated mismatch (absolute). Undefined if no simulation. */
	mismatchBps: number | null
	/** True when mismatch exceeds a threshold (e.g. > 50 bps). */
	mismatchFlag: boolean
	error: string | null
	fetchedAt: number
	/** Transaction request for signing when success. */
	transactionRequest?: SpandexQuoteTransactionRequest
}
