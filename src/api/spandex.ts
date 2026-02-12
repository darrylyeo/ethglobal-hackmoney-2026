/**
 * spanDEX meta-aggregator config. RPC uses Voltaire (createPublicClientForChain).
 * Providers: LiFi, Odos, KyberSwap, Relay (no API keys).
 */

import {
	createConfig,
	executeQuote as executeQuoteCore,
	getQuote as getQuoteCore,
	getQuotes,
	kyberswap,
	lifi,
	odos,
	relay,
} from '@spandex/core'
import type {
	Config,
	ProviderKey,
	SuccessfulSimulatedQuote,
	SwapParams,
} from '@spandex/core'
import type { WalletClient } from 'viem'
import { createPublicClientForChain } from '$/api/viem-client.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import { ProtocolStrategy } from '$/constants/protocols.ts'
import type { FetchSwapQuoteParams, SwapQuote } from '$/data/SwapQuote.ts'
import { getSwapQuoteId } from '$/api/uniswap.ts'

const SPANDEX_CLIENT_ID = 'ethglobal-hackmoney-2026'

export const spandexConfig: Config = createConfig({
	providers: [
		lifi({ apiKey: undefined }),
		odos({}),
		kyberswap({ clientId: SPANDEX_CLIENT_ID }),
		relay({}),
	],
	options: {
		deadlineMs: 12_000,
		numRetries: 1,
		initialRetryDelayMs: 200,
	},
	clients: (chainId: number) => {
		const url = rpcUrls[chainId]
		return url ? createPublicClientForChain(chainId, url) : undefined
	},
})

export const toSpandexSwapParams = (
	p: FetchSwapQuoteParams,
	swapperAccount: `0x${string}`,
): SwapParams => ({
	chainId: p.chainId,
	inputToken: p.tokenIn,
	outputToken: p.tokenOut,
	mode: 'exactIn',
	inputAmount: p.amountIn,
	slippageBps: Math.round(p.slippage * 10_000),
	swapperAccount,
})

export const getSpandexQuote = async (
	swap: SwapParams,
	strategy: ProtocolStrategy = ProtocolStrategy.BestPrice,
): Promise<SuccessfulSimulatedQuote | null> =>
	getQuoteCore({
		config: spandexConfig,
		swap,
		strategy: strategy as QuoteSelectionName,
	})

export const getSpandexQuoteForProvider = async (
	swap: SwapParams,
	provider: ProviderKey,
): Promise<SuccessfulSimulatedQuote | null> => {
	const quotes = await getQuotes({ config: spandexConfig, swap })
	const q = quotes.find(
		(r): r is SuccessfulSimulatedQuote =>
			r.success && (r as SuccessfulSimulatedQuote).provider === provider,
	)
	return q ?? null
}

export const spandexQuoteToSwapQuote = (
	quote: SuccessfulSimulatedQuote,
	params: FetchSwapQuoteParams,
): SwapQuote => ({
	id: getSwapQuoteId(params),
	chainId: params.chainId,
	tokenIn: params.tokenIn,
	tokenOut: params.tokenOut,
	amountIn: quote.inputAmount,
	amountOut: quote.simulation.outputAmount,
	priceImpact: 0,
	route: [],
	gasEstimate: quote.simulation.gasUsed ?? 0n,
	timestamp: Date.now(),
})

export const executeSpandexQuote = async (
	swap: SwapParams,
	quote: SuccessfulSimulatedQuote,
	walletClient: WalletClient,
): Promise<{ transactionHash: `0x${string}` }> =>
	executeQuoteCore({
		config: spandexConfig,
		swap,
		quote,
		walletClient,
	})
