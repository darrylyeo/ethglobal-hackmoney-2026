/**
 * LI.FI SDK integration for USDC routes and quotes.
 * Route = list of options; quote = detailed execution for one route (getQuote returns LiFiStep).
 */

import {
	config as lifiConfig,
	convertQuoteToRoute,
	createConfig,
	EVM,
	executeRoute,
	getQuote,
} from '@lifi/sdk'
import type { LiFiStep, RouteExtended } from '@lifi/sdk'
import { queryClient } from '$/lib/db/query-client'
import { ChainId } from '$/constants/networks'
import { ercTokensBySymbolByChainId } from '$/constants/coins'
import {
	createWalletClientForChain,
	type ProviderDetailType,
	switchWalletChain,
} from '$/lib/wallet'
createConfig({ integrator: 'ethglobal-hackmoney-26' })
export type QuoteStep = {
	fromChainId: number
	toChainId: number
	fromAmount: string
	toAmount: string
	estimatedGasCosts?: {
		amount: string
		token: { symbol: string; decimals?: number }
	}[]
}
export type NormalizedQuote = {
	steps: QuoteStep[]
	fromChainId: number
	toChainId: number
	fromAmount: string
	toAmount: string
	estimatedToAmount: string
	fees: { amount: string; token: { symbol: string; decimals?: number } }[]
}
function actionAmounts(
	action: LiFiStep['action'],
): { fromAmount: string; toAmount: string } {
	const fromAmount = 'fromAmount' in action && action.fromAmount != null
		? String(action.fromAmount)
		: '0'
	const toAmount = 'toAmount' in action && action.toAmount != null
		? String(action.toAmount)
		: '0'
	return { fromAmount, toAmount }
}

function mapStep(step: LiFiStep): QuoteStep {
	const action = step.action
	const { fromAmount, toAmount } = actionAmounts(action)
	return {
		fromChainId: action.fromChainId,
		toChainId: action.toChainId,
		fromAmount,
		toAmount,
		estimatedGasCosts: step.estimate?.gasCosts?.map((g) => ({
			amount: g.amount ?? '0',
			token: g.token
				? { symbol: g.token.symbol, decimals: g.token.decimals }
				: { symbol: 'unknown' },
		})),
	}
}

export function normalizeQuote(step: LiFiStep): NormalizedQuote {
	const steps = [mapStep(step)]
	const action = step.action
	const { fromAmount, toAmount } = actionAmounts(action)
	const gasCosts = step.estimate?.gasCosts ?? []
	return {
		steps,
		fromChainId: action.fromChainId,
		toChainId: action.toChainId,
		fromAmount,
		toAmount,
		estimatedToAmount: toAmount,
		fees: gasCosts.map((g) => ({
			amount: g.amount ?? '0',
			token: g.token
				? { symbol: g.token.symbol, decimals: g.token.decimals }
				: { symbol: 'unknown' },
		})),
	}
}

export type QuoteParams = {
	fromChain: number
	toChain: number
	fromAmount: string
	fromAddress: `0x${string}`
}
function getUsdcAddress(chainId: number): `0x${string}` {
	const token = ercTokensBySymbolByChainId[chainId as ChainId]?.USDC
	if (!token) throw new Error(`USDC not configured for chain ${chainId}`)
	return token.address
}

export async function getQuoteForUsdcBridge(
	params: QuoteParams,
): Promise<NormalizedQuote> {
	const { fromChain, toChain, fromAmount, fromAddress } = params
	const step = await getQuote({
		fromChain,
		toChain,
		fromToken: getUsdcAddress(fromChain),
		toToken: getUsdcAddress(toChain),
		fromAmount,
		fromAddress,
	})
	return normalizeQuote(step)
}

export function quoteQueryKey(
	params: QuoteParams,
): [string, number, number, string] {
	return ['lifi-quote', params.fromChain, params.toChain, params.fromAmount]
}

export async function fetchQuoteCached(
	params: QuoteParams,
): Promise<NormalizedQuote> {
	return await queryClient.fetchQuery({
		queryKey: quoteQueryKey(params),
		queryFn: () => getQuoteForUsdcBridge(params),
	})
}

export async function getQuoteStep(params: QuoteParams): Promise<LiFiStep> {
	const { fromChain, toChain, fromAmount, fromAddress } = params
	return await getQuote({
		fromChain,
		toChain,
		fromToken: getUsdcAddress(fromChain),
		toToken: getUsdcAddress(toChain),
		fromAmount,
		fromAddress,
	})
}

export async function executeQuote(
	providerDetail: ProviderDetailType,
	params: QuoteParams,
	options?: { updateRouteHook?: (route: RouteExtended) => void },
): Promise<RouteExtended> {
	const provider = providerDetail.provider as {
		request(args: { method: string; params?: unknown[] }): Promise<unknown>
	}
	const step = await getQuoteStep(params)
	const route = convertQuoteToRoute(step)
	lifiConfig.setProviders([
		EVM({
			getWalletClient: () =>
				Promise.resolve(createWalletClientForChain(provider, params.fromChain)),
			switchChain: async (chainId) => {
				await switchWalletChain(provider, chainId)
				return createWalletClientForChain(provider, chainId)
			},
		}),
	])
	return executeRoute(route, {
		updateRouteHook: options?.updateRouteHook,
	})
}
