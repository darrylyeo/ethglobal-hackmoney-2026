/**
 * LI.FI SDK integration for USDC routes and quotes.
 * Route = list of options; quote = detailed execution for one route (getQuote returns LiFiStep).
 * SDK is lazy-loaded so non-bridge routes stay light.
 */

import {
	coinInstanceByChainAndCoinId,
	CoinInstanceType,
} from '$/constants/coin-instances.ts'
import { CoinId } from '$/constants/coins.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import { ChainId } from '$/constants/networks.ts'
import { BridgeRouteStepType } from '$/data/BridgeRoute.ts'
import {
	BridgeOverallStatus,
	type BridgeStatus,
	mapLifiProcessStatus,
	TxState,
	type TxStatus,
	TxStep,
} from '$/lib/bridge/txStatus.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { E2E_TEVM_ENABLED, requestE2eTevmContractTx } from '$/tests/tevm.ts'
import { E2E_TEVM_WALLET_ADDRESS } from '$/tests/tevmConfig.ts'
import { createWalletClientForChain } from '$/api/viem-client.ts'
import type { ProviderDetailType } from '$/lib/wallet.ts'
import { switchWalletChain } from '$/lib/wallet.ts'
import type {
	Execution,
	LiFiStep,
	Process,
	Route,
	RouteExtended,
} from '@lifi/sdk'

const ROUTES_STALE_MS = 30_000

let lifiSdk: Promise<typeof import('@lifi/sdk')> | null = null

const getLifiSdk = async (): Promise<typeof import('@lifi/sdk')> => {
	if (!lifiSdk) {
		lifiSdk = import('@lifi/sdk').then((m) => {
			m.createConfig({ integrator: 'ethglobal-hackmoney-26', })
			return m
		})
	}
	return lifiSdk!
}

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

export type QuoteParams = {
	fromChain: number
	toChain: number
	fromAmount: string
	fromAddress: `0x${string}`
	toAddress?: `0x${string}`
	slippage?: number
}

export type NormalizedRoute = {
	id: string
	originalRoute: Route
	steps: {
		tool: string
		toolName: string
		type: BridgeRouteStepType
		fromChainId: number
		toChainId: number
		fromAmount: string
		toAmount: string
	}[]
	fromChainId: number
	toChainId: number
	fromAmount: string
	toAmount: string
	toAmountMin: string
	gasCostUsd: string
	estimatedDurationSeconds: number
	tags: ('BEST' | 'CHEAPEST' | 'FASTEST' | 'RECOMMENDED')[]
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

function actionAmounts(action: LiFiStep['action']): {
	fromAmount: string
	toAmount: string
} {
	const fromAmount =
		'fromAmount' in action && action.fromAmount != null
			? String(action.fromAmount)
			: '0'
	const toAmount =
		'toAmount' in action && action.toAmount != null
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

const ROUTE_TAG_ORDER = ['RECOMMENDED', 'CHEAPEST', 'FASTEST'] as const

/** Route with step.type widened to string so we can compare to 'swap' | 'cross'. Produced by transforming SDK routes at the fetch boundary. */
type RouteWithStringStepType = Omit<Route, 'steps'> & {
	steps: Array<Omit<Route['steps'][number], 'type'> & { type: string }>
}

export function normalizeRoute(
	route: RouteWithStringStepType,
	originalRoute: Route,
): NormalizedRoute {
	return {
		id: route.id,
		originalRoute,
		steps: route.steps.map((step) => ({
			tool: step.tool,
			toolName: step.toolDetails?.name ?? step.tool,
			type:
				step.type === 'swap'
					? BridgeRouteStepType.Swap
					: step.type === 'cross'
						? BridgeRouteStepType.Cross
						: BridgeRouteStepType.Bridge,
			fromChainId: step.action.fromChainId,
			toChainId: step.action.toChainId,
			fromAmount: step.action.fromAmount ?? '0',
			toAmount: step.estimate?.toAmount ?? step.action.fromAmount ?? '0',
		})),
		fromChainId: route.fromChainId,
		toChainId: route.toChainId,
		fromAmount: route.fromAmount,
		toAmount: route.toAmount,
		toAmountMin: route.toAmountMin,
		gasCostUsd: route.gasCostUSD ?? '0',
		estimatedDurationSeconds: route.steps.reduce(
			(sum, s) => sum + (s.estimate?.executionDuration ?? 0),
			0,
		),
		tags: (route.tags ?? []).filter(
			(t): t is (typeof ROUTE_TAG_ORDER)[number] =>
				ROUTE_TAG_ORDER.includes(t as (typeof ROUTE_TAG_ORDER)[number]),
		),
	}
}

export async function getRoutesForUsdcBridge(
	params: QuoteParams,
): Promise<NormalizedRoute[]> {
	const {
		fromChain,
		toChain,
		fromAmount,
		fromAddress,
		toAddress,
		slippage = 0.005,
	} = params
	const sdk = await getLifiSdk()
	return await queryClient.fetchQuery({
		queryKey: [
			DataSourceId.LiFi,
			'routes',
			fromChain,
			toChain,
			fromAmount,
			fromAddress,
			slippage,
		],
		queryFn: async () => {
			const result = await sdk.getRoutes({
				fromChainId: fromChain,
				toChainId: toChain,
				fromTokenAddress: getUsdcAddress(fromChain),
				toTokenAddress: getUsdcAddress(toChain),
				fromAmount,
				fromAddress,
				toAddress: toAddress ?? fromAddress,
				options: {
					slippage,
					order: 'RECOMMENDED',
					maxPriceImpact: 0.1,
				},
			})
			return result.routes.slice(0, 5).map((route) => {
				const routeWithStringStepType: RouteWithStringStepType = {
					...route,
					steps: route.steps.map((step) => ({
						...step,
						type: String(step.type),
					})),
				}
				return normalizeRoute(routeWithStringStepType, route)
			})
		},
		staleTime: ROUTES_STALE_MS,
	})
}

export function getUsdcAddress(chainId: number): `0x${string}` {
	const instance = coinInstanceByChainAndCoinId.get(`${chainId}:${CoinId.USDC}`)
	if (!instance || instance.type !== CoinInstanceType.Erc20Token)
		throw new Error(`USDC not configured for chain ${chainId}`)
	return instance.$id.address
}

export async function getQuoteForUsdcBridge(
	params: QuoteParams,
): Promise<{ quote: NormalizedQuote; step: LiFiStep }> {
	const {
		fromChain,
		toChain,
		fromAmount,
		fromAddress,
		toAddress,
		slippage = 0.005,
	} = params
	const sdk = await getLifiSdk()
	const step = await sdk.getQuote({
		fromChain,
		toChain,
		fromToken: getUsdcAddress(fromChain),
		toToken: getUsdcAddress(toChain),
		fromAmount,
		fromAddress,
		toAddress: toAddress ?? fromAddress,
		slippage,
	})
	return { quote: normalizeQuote(step), step }
}

export async function fetchQuoteCached(
	params: QuoteParams,
): Promise<{ quote: NormalizedQuote; step: LiFiStep }> {
	const { fromChain, toChain, fromAmount, toAddress, slippage = 0.005 } = params
	return await queryClient.fetchQuery({
		queryKey: [
			DataSourceId.LiFi,
			'quote',
			fromChain,
			toChain,
			fromAmount,
			toAddress,
			slippage,
		],
		queryFn: () => getQuoteForUsdcBridge(params),
		staleTime: ROUTES_STALE_MS,
	})
}

export async function getQuoteStep(params: QuoteParams): Promise<LiFiStep> {
	const {
		fromChain,
		toChain,
		fromAmount,
		fromAddress,
		toAddress,
		slippage = 0.005,
	} = params
	const sdk = await getLifiSdk()
	return await sdk.getQuote({
		fromChain,
		toChain,
		fromToken: getUsdcAddress(fromChain),
		toToken: getUsdcAddress(toChain),
		fromAmount,
		fromAddress,
		toAddress: toAddress ?? fromAddress,
		slippage,
	})
}

/** getQuote + getStepTransaction to populate transactionRequest. */
export async function getQuoteStepWithTransaction(
	params: QuoteParams,
): Promise<LiFiStep> {
	const sdk = await getLifiSdk()
	const step = await getQuoteStep(params)
	return sdk.getStepTransaction(step)
}

export async function executeQuote(
	providerDetail: ProviderDetailType,
	params: QuoteParams,
	options?: { updateRouteHook?: (route: RouteExtended) => void },
): Promise<RouteExtended> {
	const provider = providerDetail.provider as {
		request(args: { method: string; params?: unknown[] }): Promise<unknown>
	}
	const sdk = await getLifiSdk()
	const step = await getQuoteStep(params)
	const route = sdk.convertQuoteToRoute(step)
	sdk.config.setProviders([
		sdk.EVM({
			getWalletClient: () =>
				Promise.resolve(createWalletClientForChain(provider, params.fromChain)),
			switchChain: async (chainId: number) => {
				await switchWalletChain(provider, chainId)
				return createWalletClientForChain(provider, chainId)
			},
		}),
	])
	return sdk.executeRoute(route, {
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
				state !== TxState.Pending
					? (p.doneAt ?? p.failedAt ?? Date.now())
					: undefined,
	})
	}
	const steps = Array.from(stepMap.values())
	const hasFailed = steps.some((s) => s.state === TxState.Failed)
	const allDone =
		processes.length > 0 && processes.every((p) => p.status === 'DONE')
	const estimatedDurationSeconds = route.steps.reduce(
		(sum, s) => sum + (s.estimate?.executionDuration ?? 0),
		0,
	)
	return {
		overall: hasFailed
			? BridgeOverallStatus.Failed
			: allDone
				? BridgeOverallStatus.Completed
				: BridgeOverallStatus.InProgress,
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
		overall: BridgeOverallStatus.InProgress,
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

export async function executeSelectedRoute(
	providerDetail: ProviderDetailType,
	route: { originalRoute: Route; fromChainId: number },
	onStatusChange?: StatusCallback,
): Promise<RouteExtended> {
	if (E2E_TEVM_ENABLED) {
		const startedAt = Date.now()
		onStatusChange?.({
			overall: BridgeOverallStatus.InProgress,
			steps: [
				{
					step: TxStep.Send,
					state: TxState.Pending,
					chainId: route.fromChainId,
					startedAt,
				},
			],
		})
		const txHash = await requestE2eTevmContractTx({
			provider: providerDetail.provider,
			from: E2E_TEVM_WALLET_ADDRESS,
			value: BigInt(route.originalRoute.fromAmount ?? '0'),
		})
		const completedAt = Date.now()
		onStatusChange?.({
			overall: BridgeOverallStatus.Completed,
			steps: [
				{
					step: TxStep.Send,
					state: TxState.Success,
					txHash,
					chainId: route.fromChainId,
					startedAt,
					completedAt,
				},
			],
		})
		const execution = {
			startedAt,
			doneAt: completedAt,
			status: 'DONE',
			process: [
				{
					type: 'CROSS_CHAIN',
					status: 'DONE',
					chainId: route.fromChainId,
					txHash,
					startedAt,
					doneAt: completedAt,
				},
			],
		} satisfies Execution
		return {
			...route.originalRoute,
			steps: route.originalRoute.steps.map((step) => ({
				...step,
				execution,
			})),
		}
	}
	const provider = providerDetail.provider as {
		request(args: { method: string; params?: unknown[] }): Promise<unknown>
	}
	const sdk = await getLifiSdk()
	sdk.config.setProviders([
		sdk.EVM({
			getWalletClient: () =>
				Promise.resolve(
					createWalletClientForChain(provider, route.fromChainId),
				),
			switchChain: async (chainId: number) => {
				await switchWalletChain(provider, chainId)
				return createWalletClientForChain(provider, chainId)
			},
		}),
	])
	const status: BridgeStatus = {
		overall: BridgeOverallStatus.InProgress,
		steps: [],
	}
	if (onStatusChange) onStatusChange({ ...status })
	return sdk.executeRoute(route.originalRoute, {
		updateRouteHook: onStatusChange
			? (updatedRoute) => {
					const next = routeToBridgeStatus(updatedRoute)
					status.overall = next.overall
					status.steps = next.steps
					status.estimatedDurationSeconds = next.estimatedDurationSeconds
					onStatusChange({ ...status })
				}
			: undefined,
	})
}
