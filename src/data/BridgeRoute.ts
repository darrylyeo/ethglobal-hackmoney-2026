import type { Route } from '@lifi/sdk'
import type { BridgeError } from '$/lib/bridge/errors'

export type BridgeRoutes$Id = {
	fromChainId: number
	toChainId: number
	amount: bigint
	fromAddress: `0x${string}`
	slippage: number
}

export type BridgeRouteStep = {
	tool: string
	toolName: string
	type: 'bridge' | 'swap' | 'cross'
	fromChainId: number
	toChainId: number
	fromAmount: bigint
	toAmount: bigint
}

export type BridgeRoute = {
	id: string
	originalRoute: Route
	steps: BridgeRouteStep[]
	fromChainId: number
	toChainId: number
	fromAmount: bigint
	toAmount: bigint
	toAmountMin: bigint
	gasCostUsd: number
	estimatedDurationSeconds: number
	tags: ('BEST' | 'CHEAPEST' | 'FASTEST' | 'RECOMMENDED')[]
}

export type BridgeRoutes = {
	$id: BridgeRoutes$Id
	routes: BridgeRoute[]
	fetchedAt: number
	isLoading: boolean
	error: BridgeError | null
}
