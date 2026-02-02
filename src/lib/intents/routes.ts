import type { BridgeRoute, BridgeRoutes$id } from '$/collections/bridge-routes'
import type { SwapQuote } from '$/collections/swap-quotes'
import type { IntentResolution } from './types'

export type IntentRouteStep =
	| {
		id: string
		type: 'transfer'
		mode: 'direct' | 'channel'
		chainId: number
		fromActor: `0x${string}`
		toActor: `0x${string}`
		tokenAddress: `0x${string}`
	}
	| {
		id: string
		type: 'swap'
		chainId: number
		actor: `0x${string}`
		quote: SwapQuote
	}
	| {
		id: string
		type: 'bridge'
		fromChainId: number
		toChainId: number
		actor: `0x${string}`
		route: BridgeRoute
		rowId: BridgeRoutes$id
	}

export type IntentRoute = {
	id: string
	label: string
	steps: IntentRouteStep[]
}

export type IntentBridgeRouteOption = {
	rowId: BridgeRoutes$id
	route: BridgeRoute
}

type IntentRouteInputs = {
	swapQuotes: SwapQuote[]
	bridgeRoutes: IntentBridgeRouteOption[]
}

const productRoutes = (steps: IntentRouteStep[][]) => (
	steps.reduce<IntentRouteStep[][]>(
		(result, options) => (
			result.flatMap((existing) => options.map((step) => [...existing, step]))
		),
		[[]],
	)
)

const buildRouteLabel = (steps: IntentRouteStep[]) => (
	steps
		.map((step) => (
			step.type === 'transfer'
				? `transfer:${step.mode}`
				: step.type
		))
		.join(' → ')
)

export const buildIntentRoutes = (
	resolution: IntentResolution,
	{ swapQuotes, bridgeRoutes }: IntentRouteInputs,
): IntentRoute[] => {
	if (resolution.status !== 'valid' || !resolution.kind) return []
	const from = resolution.from.dimensions
	const to = resolution.to.dimensions
	if (!from.actor || !from.chainId || !from.tokenAddress) return []
	if (!to.actor || !to.chainId || !to.tokenAddress) return []

	const swapOnChain = (
		chainId: number,
		tokenIn: `0x${string}`,
		tokenOut: `0x${string}`,
		actor: `0x${string}`,
	): IntentRouteStep[] => (
		swapQuotes
			.filter((quote) => (
				quote.chainId === chainId &&
				quote.tokenIn.toLowerCase() === tokenIn.toLowerCase() &&
				quote.tokenOut.toLowerCase() === tokenOut.toLowerCase()
			))
			.map((quote) => ({
				id: `swap:${quote.id}`,
				type: 'swap',
				chainId,
				actor,
				quote,
			}))
	)

	const bridgeOnChain = (
		fromChainId: number,
		toChainId: number,
		actor: `0x${string}`,
	): IntentRouteStep[] => (
		bridgeRoutes
			.filter(({ rowId, route }) => (
				rowId.fromChainId === fromChainId &&
				rowId.toChainId === toChainId &&
				rowId.fromAddress.toLowerCase() === actor.toLowerCase() &&
				route.fromChainId === fromChainId &&
				route.toChainId === toChainId
			))
			.map(({ rowId, route }) => ({
				id: `bridge:${rowId.fromChainId}:${rowId.toChainId}:${route.id}`,
				type: 'bridge',
				fromChainId,
				toChainId,
				actor,
				route,
				rowId,
			}))
	)

	const transferStepOptions = (chainId: number, token: `0x${string}`): IntentRouteStep[] => (
		[
			{
				id: `transfer:direct:${chainId}:${from.actor}:${to.actor}:${token}`,
				type: 'transfer',
				mode: 'direct',
				chainId,
				fromActor: from.actor,
				toActor: to.actor,
				tokenAddress: token,
			},
			{
				id: `transfer:channel:${chainId}:${from.actor}:${to.actor}:${token}`,
				type: 'transfer',
				mode: 'channel',
				chainId,
				fromActor: from.actor,
				toActor: to.actor,
				tokenAddress: token,
			},
		]
	)

	const swapSource = swapOnChain(from.chainId, from.tokenAddress, to.tokenAddress, from.actor)
	const swapDest = swapOnChain(to.chainId, from.tokenAddress, to.tokenAddress, to.actor)
	const bridge = bridgeOnChain(from.chainId, to.chainId, from.actor)

	const transferFromToken = transferStepOptions(from.chainId, from.tokenAddress)
	const transferToTokenOnSource = transferStepOptions(from.chainId, to.tokenAddress)
	const transferToTokenOnDest = transferStepOptions(to.chainId, to.tokenAddress)
	const transferFromTokenOnDest = transferStepOptions(to.chainId, from.tokenAddress)

	const sequences: IntentRouteStep[][][] = (
		resolution.kind === 'transfer'
			? [[transferFromToken]]
		: resolution.kind === 'swap'
			? [[swapSource]]
		: resolution.kind === 'bridge'
			? [[bridge]]
		: resolution.kind === 'transfer+swap'
			? [
				[swapSource, transferToTokenOnSource],
				[transferFromToken, swapDest],
			]
		: resolution.kind === 'swap+bridge'
			? [
				[swapSource, bridge],
				[bridge, swapDest],
			]
		: resolution.kind === 'transfer+bridge'
			? [
				[bridge, transferToTokenOnDest],
			]
		:
			[
				[swapSource, bridge, transferToTokenOnDest],
				[bridge, swapDest, transferToTokenOnDest],
				[bridge, transferFromTokenOnDest, swapDest],
			]
	)
		.filter((sequence) => sequence.every((options) => options.length > 0))

	return sequences
		.flatMap((sequence) => productRoutes(sequence))
		.map((steps, index) => ({
			id: `${steps.map((step) => step.id).join('|')}-${index}`,
			label: buildRouteLabel(steps),
			steps,
		}))
}
