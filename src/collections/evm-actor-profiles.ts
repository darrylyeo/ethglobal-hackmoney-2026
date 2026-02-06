/**
 * ENS primary name and avatar per (chainId, address). Fetched via Voltaire,
 * cached for EvmActor display.
 */

import {
	resolveEnsForward,
	resolveEnsReverse,
} from '$/api/identity-resolve.ts'
import { createHttpProvider } from '$/api/voltaire.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { identityResolvers } from '$/constants/identity-resolver.ts'
import type { ChainId } from '$/constants/networks.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import type { EvmActorProfile, EvmActorProfile$Id } from '$/data/EvmActorProfile.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type EvmActorProfileRow = EvmActorProfile & {
	isLoading?: boolean
	error?: string | null
}

export const evmActorProfilesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'evm-actor-profiles',
		getKey: (row: EvmActorProfileRow) =>
			`${row.$id.chainId}:${row.$id.address.toLowerCase()}`,
	}),
)

function getEnsResolverForChain(chainId: ChainId) {
	return identityResolvers.find(
		(r) => r.chainId === chainId && r.ensRegistry,
	)
}

export const ensureEvmActorProfile = (
	chainId: ChainId,
	address: `0x${string}`,
): void => {
	const normalized = address.toLowerCase() as `0x${string}`
	const key = `${chainId}:${normalized}` as unknown as Parameters<
		typeof evmActorProfilesCollection.state.get
	>[0]
	if (!evmActorProfilesCollection.state.get(key))
		fetchEvmActorProfile(chainId, normalized).catch(() => {})
}

export const fetchEvmActorProfile = async (
	chainId: ChainId,
	address: `0x${string}`,
): Promise<EvmActorProfile> => {
	const key = `${chainId}:${address.toLowerCase()}` as unknown as Parameters<
		typeof evmActorProfilesCollection.state.get
	>[0]
	const existing = evmActorProfilesCollection.state.get(key)
	const $id: EvmActorProfile$Id = { chainId, address }

	if (existing) {
		evmActorProfilesCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		evmActorProfilesCollection.insert({
			$id,
			$source: DataSource.Voltaire,
			isLoading: true,
			error: null,
		})
	}

	const resolver = getEnsResolverForChain(chainId)
	const url = rpcUrls[chainId]
	if (!resolver?.ensRegistry || !url) {
		const err = resolver
			? `No RPC URL for chain ${chainId}`
			: `No ENS resolver for chain ${chainId}`
		evmActorProfilesCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = err
		})
		return { $id, $source: DataSource.Voltaire }
	}

	try {
		const provider = createHttpProvider(url)
		const primaryName = await resolveEnsReverse(
			provider,
			resolver.ensRegistry,
			address,
		)
		let avatarUrl: string | undefined
		if (primaryName) {
			const { textRecords } = await resolveEnsForward(
				provider,
				resolver.ensRegistry,
				primaryName,
				['avatar'],
			)
			avatarUrl = textRecords['avatar']
		}
		const row: EvmActorProfileRow = {
			$id,
			primaryName: primaryName ?? undefined,
			avatarUrl,
			$source: DataSource.Voltaire,
			isLoading: false,
			error: null,
		}
		evmActorProfilesCollection.update(key, (draft) => {
			Object.assign(draft, row)
		})
		return {
			$id: row.$id,
			primaryName: row.primaryName,
			avatarUrl: row.avatarUrl,
			$source: row.$source,
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		evmActorProfilesCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = message
		})
		throw e
	}
}
