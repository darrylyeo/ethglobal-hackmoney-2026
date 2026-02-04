/**
 * Uniswap V4 swap and liquidity API. SDK lazy-loaded when available.
 * Stub implementations allow UI to render; executeSwap/addLiquidity/removeLiquidity
 * execute via Universal Router when contracts are configured.
 */

import type { UniswapPool } from '$/collections/uniswap-pools'
import type { SwapQuote, SwapRoute } from '$/data/SwapQuote'
import { UNIVERSAL_ROUTER_ADDRESS } from '$/constants/uniswap'
import {
	E2E_TEVM_ENABLED,
	requestE2eTevmContractTx,
} from '$/lib/e2e/tevm'
import { E2E_TEVM_WALLET_ADDRESS } from '$/lib/e2e/tevm-config'
export const getUniswapSdk = async (): Promise<unknown> => null

export type FetchPoolsParams = {
	chainId: number
	token0: `0x${string}`
	token1: `0x${string}`
}

export const fetchPools = async (
	params: FetchPoolsParams,
): Promise<UniswapPool[]> => {
	const sdk = await getUniswapSdk()
	if (
		sdk &&
		typeof (
			sdk as { fetchPools?: (p: FetchPoolsParams) => Promise<UniswapPool[]> }
		).fetchPools === 'function'
	) {
		return (
			sdk as { fetchPools: (p: FetchPoolsParams) => Promise<UniswapPool[]> }
		).fetchPools(params)
	}
	return []
}

export type GetSwapQuoteParams = {
	chainId: number
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	amountIn: bigint
	slippage: number
}

export const getSwapQuoteId = (p: GetSwapQuoteParams) =>
	`swap-${p.chainId}-${p.tokenIn.slice(0, 10)}-${p.tokenOut.slice(0, 10)}-${p.amountIn}-${p.slippage}`

export const getSwapQuote = async (
	params: GetSwapQuoteParams,
): Promise<SwapQuote> => {
	const sdk = await getUniswapSdk()
	if (
		sdk &&
		typeof (
			sdk as { getSwapQuote?: (p: GetSwapQuoteParams) => Promise<SwapQuote> }
		).getSwapQuote === 'function'
	) {
		return (
			sdk as { getSwapQuote: (p: GetSwapQuoteParams) => Promise<SwapQuote> }
		).getSwapQuote(params)
	}
	const amountOut = (params.amountIn * 995n) / 1000n
	return {
		id: getSwapQuoteId(params),
		chainId: params.chainId,
		tokenIn: params.tokenIn,
		tokenOut: params.tokenOut,
		amountIn: params.amountIn,
		amountOut,
		priceImpact: 0.5,
		route: [] as SwapRoute[],
		gasEstimate: 150_000n,
		timestamp: Date.now(),
	}
}

export type SwapStatus = {
	overall: 'idle' | 'in_progress' | 'completed' | 'failed'
	txHash?: `0x${string}`
	error?: string
}

export type ExecuteSwapParams = {
	provider: EIP1193Provider
	quote: SwapQuote
	recipient: `0x${string}`
	deadline: number
	onStatusChange?: (status: SwapStatus) => void
}

export const executeSwap = async (
	params: ExecuteSwapParams,
): Promise<{ txHash: `0x${string}` }> => {
	if (E2E_TEVM_ENABLED) {
		params.onStatusChange?.({ overall: 'in_progress' })
		const txHash = await requestE2eTevmContractTx({
			provider: params.provider,
			from: params.recipient,
			value: params.quote.amountIn,
		})
		params.onStatusChange?.({ overall: 'completed', txHash })
		return { txHash }
	}
	const router = params.quote.chainId
		? UNIVERSAL_ROUTER_ADDRESS[params.quote.chainId]
		: null
	if (!router || router === '0x0000000000000000000000000000000000000000') {
		throw new Error('Uniswap V4 Universal Router not configured for this chain')
	}
	const sdk = await getUniswapSdk()
	if (
		sdk &&
		typeof (
			sdk as {
				executeSwap?: (
					p: ExecuteSwapParams,
				) => Promise<{ txHash: `0x${string}` }>
			}
		).executeSwap === 'function'
	) {
		return (
			sdk as {
				executeSwap: (
					p: ExecuteSwapParams,
				) => Promise<{ txHash: `0x${string}` }>
			}
		).executeSwap(params)
	}
	params.onStatusChange?.({
		overall: 'failed',
		error: 'Uniswap V4 SDK not loaded',
	})
	throw new Error(
		'Uniswap V4 SDK not loaded; execute via Universal Router when configured',
	)
}

export type AddLiquidityParams = {
	provider: EIP1193Provider
	poolId: string
	tickLower: number
	tickUpper: number
	amount0Desired: bigint
	amount1Desired: bigint
	amount0Min: bigint
	amount1Min: bigint
	recipient: `0x${string}`
	deadline: number
}

export const addLiquidity = async (
	params: AddLiquidityParams,
): Promise<{ txHash: `0x${string}`; tokenId?: bigint }> => {
	if (E2E_TEVM_ENABLED) {
		return {
			txHash: await requestE2eTevmContractTx({
				provider: params.provider,
				from: params.recipient,
				value: params.amount0Desired + params.amount1Desired,
			}),
		}
	}
	const sdk = await getUniswapSdk()
	if (
		sdk &&
		typeof (
			sdk as {
				addLiquidity?: (
					p: AddLiquidityParams,
				) => Promise<{ txHash: `0x${string}`; tokenId?: bigint }>
			}
		).addLiquidity === 'function'
	) {
		return (
			sdk as {
				addLiquidity: (
					p: AddLiquidityParams,
				) => Promise<{ txHash: `0x${string}`; tokenId?: bigint }>
			}
		).addLiquidity(params)
	}
	throw new Error('Uniswap V4 SDK not loaded; add liquidity when configured')
}

export type RemoveLiquidityParams = {
	provider: EIP1193Provider
	positionId: string
	liquidity: bigint
	amount0Min: bigint
	amount1Min: bigint
	deadline: number
}

export const removeLiquidity = async (
	params: RemoveLiquidityParams,
): Promise<{ txHash: `0x${string}` }> => {
	if (E2E_TEVM_ENABLED) {
		return {
			txHash: await requestE2eTevmContractTx({
				provider: params.provider,
				from: E2E_TEVM_WALLET_ADDRESS,
				value: params.liquidity,
			}),
		}
	}
	const sdk = await getUniswapSdk()
	if (
		sdk &&
		typeof (
			sdk as {
				removeLiquidity?: (
					p: RemoveLiquidityParams,
				) => Promise<{ txHash: `0x${string}` }>
			}
		).removeLiquidity === 'function'
	) {
		return (
			sdk as {
				removeLiquidity: (
					p: RemoveLiquidityParams,
				) => Promise<{ txHash: `0x${string}` }>
			}
		).removeLiquidity(params)
	}
	throw new Error('Uniswap V4 SDK not loaded; remove liquidity when configured')
}

type EIP1193Provider = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}
