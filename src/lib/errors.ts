export enum ErrorCode {
	NETWORK = 'NETWORK',
	TIMEOUT = 'TIMEOUT',
	RATE_LIMITED = 'RATE_LIMITED',
	RPC_ERROR = 'RPC_ERROR',

	USER_REJECTED = 'USER_REJECTED',
	WALLET_DISCONNECTED = 'WALLET_DISCONNECTED',
	WRONG_CHAIN = 'WRONG_CHAIN',
	CHAIN_NOT_SUPPORTED = 'CHAIN_NOT_SUPPORTED',

	INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
	INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
	APPROVAL_FAILED = 'APPROVAL_FAILED',
	EXECUTION_FAILED = 'EXECUTION_FAILED',
	EXECUTION_REVERTED = 'EXECUTION_REVERTED',
	SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',

	NO_ROUTES = 'NO_ROUTES',
	QUOTE_EXPIRED = 'QUOTE_EXPIRED',
	AMOUNT_TOO_LOW = 'AMOUNT_TOO_LOW',
	AMOUNT_TOO_HIGH = 'AMOUNT_TOO_HIGH',

	UNKNOWN = 'UNKNOWN',
}

export type BridgeError = {
	code: ErrorCode
	title: string
	message: string
	suggestion: string
	retryable: boolean
	retryDelay?: number
	originalError?: Error
}

const ERROR_PATTERNS: [RegExp, Partial<BridgeError>][] = [
	[
		/user rejected|user denied|rejected by user|cancelled/i,
		{
			code: ErrorCode.USER_REJECTED,
			title: 'Transaction cancelled',
			message: 'You declined the transaction in your wallet.',
			suggestion: 'Click the button again when ready.',
			retryable: true,
		},
	],
	[
		/insufficient funds|exceeds balance|not enough/i,
		{
			code: ErrorCode.INSUFFICIENT_FUNDS,
			title: 'Insufficient funds',
			message: "Your wallet doesn't have enough tokens for this transfer.",
			suggestion: 'Reduce the amount or add funds to your wallet.',
			retryable: false,
		},
	],
	[
		/insufficient.*gas|gas too low|out of gas/i,
		{
			code: ErrorCode.INSUFFICIENT_GAS,
			title: 'Insufficient gas',
			message: "Your wallet doesn't have enough native tokens to pay for gas.",
			suggestion: 'Add ETH (or native token) to your wallet for gas fees.',
			retryable: false,
		},
	],
	[
		/no routes|no quotes|route not found|path not found/i,
		{
			code: ErrorCode.NO_ROUTES,
			title: 'No routes available',
			message: 'No bridge routes found for this transfer.',
			suggestion: 'Try a different chain pair, amount, or wait and retry.',
			retryable: true,
		},
	],
	[
		/quote expired|quote.*stale|price changed/i,
		{
			code: ErrorCode.QUOTE_EXPIRED,
			title: 'Quote expired',
			message: 'The quote has expired. Prices may have changed.',
			suggestion: 'Get a new quote and try again.',
			retryable: true,
		},
	],
	[
		/slippage|price impact|output.*less than/i,
		{
			code: ErrorCode.SLIPPAGE_EXCEEDED,
			title: 'Slippage too high',
			message: 'Price moved too much during the transaction.',
			suggestion: 'Increase slippage tolerance or try a smaller amount.',
			retryable: true,
		},
	],
	[
		/rate limit|too many requests|429/i,
		{
			code: ErrorCode.RATE_LIMITED,
			title: 'Too many requests',
			message: 'Please wait a moment before trying again.',
			suggestion: 'Wait 30 seconds, then retry.',
			retryable: true,
			retryDelay: 30000,
		},
	],
	[
		/network|fetch|timeout|ECONNREFUSED|ETIMEDOUT/i,
		{
			code: ErrorCode.NETWORK,
			title: 'Network error',
			message: 'Unable to connect to the network.',
			suggestion: 'Check your internet connection and try again.',
			retryable: true,
		},
	],
	[
		/reverted|revert|execution failed/i,
		{
			code: ErrorCode.EXECUTION_REVERTED,
			title: 'Transaction failed',
			message: 'The transaction was rejected by the blockchain.',
			suggestion: 'The route may have changed. Get a new quote.',
			retryable: true,
		},
	],
	[
		/rpc|eth_|call exception/i,
		{
			code: ErrorCode.RPC_ERROR,
			title: 'Blockchain error',
			message: 'Error communicating with the blockchain.',
			suggestion: 'Try again in a few seconds.',
			retryable: true,
			retryDelay: 3000,
		},
	],
	[
		/chain.*not.*support|unsupported.*chain/i,
		{
			code: ErrorCode.CHAIN_NOT_SUPPORTED,
			title: 'Chain not supported',
			message: 'This chain is not supported by the bridge.',
			suggestion: 'Select a different chain.',
			retryable: false,
		},
	],
	[
		/wrong.*chain|chain.*mismatch|switch.*chain/i,
		{
			code: ErrorCode.WRONG_CHAIN,
			title: 'Wrong network',
			message: 'Your wallet is connected to the wrong network.',
			suggestion: 'Switch to the correct network in your wallet.',
			retryable: true,
		},
	],
	[
		/amount.*too low|below minimum|min.*amount/i,
		{
			code: ErrorCode.AMOUNT_TOO_LOW,
			title: 'Amount too low',
			message: 'The amount is below the minimum for this route.',
			suggestion: 'Enter a larger amount.',
			retryable: false,
		},
	],
	[
		/amount.*too high|exceeds maximum|max.*amount/i,
		{
			code: ErrorCode.AMOUNT_TOO_HIGH,
			title: 'Amount too high',
			message: 'The amount exceeds the maximum for this route.',
			suggestion: 'Enter a smaller amount.',
			retryable: false,
		},
	],
	[
		/approval failed|allowance|approve.*failed/i,
		{
			code: ErrorCode.APPROVAL_FAILED,
			title: 'Approval failed',
			message: 'Token approval failed.',
			suggestion: 'Try again or check your wallet has enough gas.',
			retryable: true,
		},
	],
	[
		/wallet.*disconnect|disconnected|connection.*lost/i,
		{
			code: ErrorCode.WALLET_DISCONNECTED,
			title: 'Wallet disconnected',
			message: 'Your wallet was disconnected.',
			suggestion: 'Reconnect your wallet and try again.',
			retryable: true,
		},
	],
]

export const categorizeError = (error: unknown): BridgeError => {
	if (isBridgeError(error)) return error
	const rawMessage = error instanceof Error ? error.message : String(error)
	for (const [pattern, errorInfo] of ERROR_PATTERNS) {
		if (pattern.test(rawMessage)) {
			return {
				code: errorInfo.code ?? ErrorCode.UNKNOWN,
				title: errorInfo.title ?? 'Error',
				message: errorInfo.message ?? rawMessage,
				suggestion: errorInfo.suggestion ?? 'Please try again.',
				retryable: errorInfo.retryable ?? true,
				retryDelay: errorInfo.retryDelay,
				originalError: error instanceof Error ? error : undefined,
			}
		}
	}
	return {
		code: ErrorCode.UNKNOWN,
		title: 'Something went wrong',
		message: 'An unexpected error occurred.',
		suggestion: 'Please try again. If the problem persists, refresh the page.',
		retryable: true,
		originalError: error instanceof Error ? error : undefined,
	}
}

export const isBridgeError = (x: unknown): x is BridgeError =>
	typeof x === 'object' &&
	x !== null &&
	'code' in x &&
	'title' in x &&
	'message' in x &&
	'suggestion' in x &&
	'retryable' in x

export const isRetryable = (error: BridgeError): boolean => error.retryable

export const getRetryDelay = (error: BridgeError, attempt: number): number => {
	const baseDelay = error.retryDelay ?? 1000
	return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000)
}
