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
import type { LiFiStep, Process, RouteExtended } from '@lifi/sdk'
import { queryClient } from '$/lib/db/query-client'
import { ChainId } from '$/constants/networks'
import { ercTokensBySymbolByChainId } from '$/constants/coins'
import {
	createWalletClientForChain,
	type ProviderDetailType,
	switchWalletChain,
} from '$/lib/wallet'
import {
	type BridgeStatus,
	mapLifiProcessStatus,
	type TxStatus,
} from '$/lib/tx-status'
createConfig({ integrator: 'ethglobal-hackmoney-26' })

export type StatusCallback = (status: BridgeStatus) => void

export type FeeBreakdown = {
	gasCost: {
		amount: string
		amountUsd: string
		token: { symbol: string; decimals: number }
		chainId: number
	}[]
	protocolFees: {
		name: string
		amount: string
		amountUsd: string
		token: { symbol: string; decimals: number }
	}[]
	totalUsd: string
	percentOfTransfer: number
}

type RouteLike = {
	steps: Array<{
		action: { fromChainId: number }
		estimate?: {
			gasCosts?: Array<{
				amount?: string
				amountUSD?: string
				token?: { symbol?: string; decimals?: number }
			}>
			feeCosts?: Array<{
				name?: string
				amount?: string
				amountUSD?: string
				token?: { symbol?: string; decimals?: number }
			}>
			fromAmountUSD?: string
		}
		toolDetails?: { name?: string }
	}>
	fromAmount?: string
	fromAmountUSD?: string
}

export const extractFeeBreakdown = (route: RouteLike): FeeBreakdown => {
	const gasCost: FeeBreakdown['gasCost'] = []
	const protocolFees: FeeBreakdown['protocolFees'] = []
	let totalUsd = 0
	for (const step of route.steps) {
		if (step.estimate?.gasCosts) {
			for (const gas of step.estimate.gasCosts) {
				gasCost.push({
					amount: gas.amount ?? '0',
					amountUsd: gas.amountUSD ?? '0',
					token: {
						symbol: gas.token?.symbol ?? 'ETH',
						decimals: gas.token?.decimals ?? 18,
					},
					chainId: step.action.fromChainId,
				})
				totalUsd += parseFloat(gas.amountUSD ?? '0')
			}
		}
		if (step.estimate?.feeCosts) {
			for (const fee of step.estimate.feeCosts) {
				protocolFees.push({
					name: fee.name ?? step.toolDetails?.name ?? 'Bridge fee',
					amount: fee.amount ?? '0',
					amountUsd: fee.amountUSD ?? '0',
					token: {
						symbol: fee.token?.symbol ?? 'USDC',
						decimals: fee.token?.decimals ?? 6,
					},
				})
				totalUsd += parseFloat(fee.amountUSD ?? '0')
			}
		}
	}
	const fromAmountUsd = parseFloat(
		route.fromAmountUSD ?? route.steps[0]?.estimate?.fromAmountUSD ?? '0',
	)
	const percentOfTransfer =
		fromAmountUsd > 0 ? (totalUsd / fromAmountUsd) * 100 : 0
	return {
		gasCost,
		protocolFees,
		totalUsd: totalUsd.toFixed(2),
		percentOfTransfer: Math.round(percentOfTransfer * 100) / 100,
	}
}

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
	toAddress?: `0x${string}`
}
export function getUsdcAddress(chainId: number): `0x${string}` {
	const token = ercTokensBySymbolByChainId[chainId as ChainId]?.USDC
	if (!token) throw new Error(`USDC not configured for chain ${chainId}`)
	return token.address
}

export async function getQuoteForUsdcBridge(
	params: QuoteParams,
): Promise<{ quote: NormalizedQuote; step: LiFiStep }> {
	const { fromChain, toChain, fromAmount, fromAddress, toAddress } = params
	const step = await getQuote({
		fromChain,
		toChain,
		fromToken: getUsdcAddress(fromChain),
		toToken: getUsdcAddress(toChain),
		fromAmount,
		fromAddress,
		toAddress: toAddress ?? fromAddress,
	})
	return { quote: normalizeQuote(step), step }
}

export function quoteQueryKey(
	params: QuoteParams,
): [string, number, number, string, string | undefined] {
	return [
		'lifi-quote',
		params.fromChain,
		params.toChain,
		params.fromAmount,
		params.toAddress,
	]
}

export async function fetchQuoteCached(
	params: QuoteParams,
): Promise<{ quote: NormalizedQuote; step: LiFiStep }> {
	return await queryClient.fetchQuery({
		queryKey: quoteQueryKey(params),
		queryFn: () => getQuoteForUsdcBridge(params),
	})
}

export async function getQuoteStep(params: QuoteParams): Promise<LiFiStep> {
	const { fromChain, toChain, fromAmount, fromAddress, toAddress } = params
	return await getQuote({
		fromChain,
		toChain,
		fromToken: getUsdcAddress(fromChain),
		toToken: getUsdcAddress(toChain),
		fromAmount,
		fromAddress,
		toAddress: toAddress ?? fromAddress,
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

function routeToBridgeStatus(route: RouteExtended): BridgeStatus {
	const processes = route.steps.flatMap(
		(s) => (s.execution?.process ?? []) as Process[],
	)
	const stepMap = new Map<TxStatus['step'], TxStatus>()
	for (const p of processes) {
		const { step, state } = mapLifiProcessStatus(p.type, p.status)
		stepMap.set(step, {
			step,
			state,
			txHash: p.txHash,
			chainId: p.chainId,
			error: p.error?.message,
			startedAt: p.startedAt,
			completedAt:
				state !== 'pending' ? (p.doneAt ?? p.failedAt ?? Date.now()) : undefined,
		})
	}
	const steps = Array.from(stepMap.values())
	const hasFailed = steps.some((s) => s.state === 'failed')
	const allDone = processes.length > 0 && processes.every((p) => p.status === 'DONE')
	const estimatedDurationSeconds = route.steps.reduce(
		(sum, s) => sum + (s.estimate?.executionDuration ?? 0),
		0,
	)
	return {
		overall: hasFailed ? 'failed' : allDone ? 'completed' : 'in_progress',
		steps,
		estimatedDurationSeconds: estimatedDurationSeconds || undefined,
	}
}

export async function executeQuoteWithStatus(
	providerDetail: ProviderDetailType,
	params: QuoteParams,
	onStatusChange: StatusCallback,
): Promise<RouteExtended> {
	const status: BridgeStatus = {
		overall: 'in_progress',
		steps: [],
	}
	onStatusChange({ ...status })
	return executeQuote(providerDetail, params, {
		updateRouteHook(route) {
			const next = routeToBridgeStatus(route)
			status.overall = next.overall
			status.steps = next.steps
			status.estimatedDurationSeconds = next.estimatedDurationSeconds
			onStatusChange({ ...status })
		},
	})
}
