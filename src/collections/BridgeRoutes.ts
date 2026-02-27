/**
 * Bridge routes collection: quote cache keyed by params.
 * In-memory cache, no persistence needed.
 * Converts API string amounts to bigint at the boundary.
 */

import { CollectionId } from '$/constants/collections.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify } from 'devalue'
import { getRoutesForUsdcBridge, type NormalizedRoute } from '$/api/lifi.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type {
	BridgeRoute,
	BridgeRoutes,
	BridgeRoutes$Id,
} from '$/data/BridgeRoute.ts'
import { categorizeError, isBridgeError } from '$/lib/bridge/errors.ts'

export type BridgeRouteItemRow = BridgeRoute & {
	$id: {
		routeId: string
		quote: BridgeRoutes$Id
	}
	$source: DataSourceId
	fetchedAt: number
}

const ROUTES_REQUEST_TIMEOUT_MS = 45_000

export const bridgeRoutesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.BridgeRoutes,
		getKey: (route: WithSource<BridgeRoutes>) => stringify(route.$id),
	}),
)

export const bridgeRouteItemsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.BridgeRouteItems,
		getKey: (routeItem: BridgeRouteItemRow) => stringify(routeItem.$id),
	}),
)

const normalizedToBridgeRoute = (r: NormalizedRoute): BridgeRoute => ({
	id: r.id,
	originalRoute: r.originalRoute,
	steps: r.steps.map((s) => ({
		tool: s.tool,
		toolName: s.toolName,
		type: s.type,
		fromChainId: s.fromChainId,
		toChainId: s.toChainId,
		fromAmount: BigInt(s.fromAmount),
		toAmount: BigInt(s.toAmount),
	})),
	fromChainId: r.fromChainId,
	toChainId: r.toChainId,
	fromAmount: BigInt(r.fromAmount),
	toAmount: BigInt(r.toAmount),
	toAmountMin: BigInt(r.toAmountMin),
	gasCostUsd: parseFloat(r.gasCostUsd),
	estimatedDurationSeconds: r.estimatedDurationSeconds,
	tags: r.tags,
})

export const fetchBridgeRoutes = async ($id: BridgeRoutes$Id) => {
	const key = stringify($id)
	const existing = bridgeRoutesCollection.state.get(key)

	// Set loading state
	if (existing) {
		bridgeRoutesCollection.update(key, (draft) => {
			draft.$source = DataSourceId.LiFi
			draft.isLoading = true
			draft.error = null
		})
	} else {
		bridgeRoutesCollection.insert({
			$id,
			$source: DataSourceId.LiFi,
			routes: [],
			fetchedAt: 0,
			isLoading: true,
			error: null,
		})
	}

	try {
		const apiRoutes = await Promise.race([
			getRoutesForUsdcBridge({
				fromChain: $id.fromChainId,
				toChain: $id.toChainId,
				fromAmount: $id.amount.toString(),
				fromAddress: $id.fromAddress,
				slippage: $id.slippage,
			}),
			new Promise<never>((_, reject) =>
				setTimeout(
					() => reject(new Error('Routes request timed out')),
					ROUTES_REQUEST_TIMEOUT_MS,
				),
			),
		])

		const routes = apiRoutes.map(normalizedToBridgeRoute)
		const fetchedAt = Date.now()
		bridgeRoutesCollection.update(key, (draft) => {
			draft.$source = DataSourceId.LiFi
			draft.routes = routes
			draft.fetchedAt = fetchedAt
			draft.isLoading = false
			draft.error = null
		})
		const routeEntries = routes.map((route) => ({
			...route,
			$id: {
				routeId: route.id,
				quote: $id,
			},
			$source: DataSourceId.LiFi,
			fetchedAt,
		}))
		const routeKeys = new Set(routeEntries.map((route) => stringify(route.$id)))
		for (const [routeKey, route] of bridgeRouteItemsCollection.state) {
			if (
				route.$source === DataSourceId.LiFi &&
				stringify(route.$id.quote) === key &&
				!routeKeys.has(routeKey)
			)
				bridgeRouteItemsCollection.delete(routeKey)
		}
		for (const route of routeEntries) {
			const routeKey = stringify(route.$id)
			const existingRow = bridgeRouteItemsCollection.state.get(routeKey)
			if (existingRow) {
				bridgeRouteItemsCollection.update(routeKey, (draft) => {
					Object.assign(draft, route)
				})
			} else {
				bridgeRouteItemsCollection.insert(route)
			}
		}
		return { routes, fetchedAt }
	} catch (e) {
		bridgeRoutesCollection.update(key, (draft) => {
			draft.$source = DataSourceId.LiFi
			draft.isLoading = false
			draft.error = isBridgeError(e) ? e : categorizeError(e)
		})
		throw e
	}
}

export const getBridgeRoutes = ($id: BridgeRoutes$Id) =>
	bridgeRoutesCollection.state.get(stringify($id))
