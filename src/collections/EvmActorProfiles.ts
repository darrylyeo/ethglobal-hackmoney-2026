/**
 * ENS primary name and avatar per (chainId, address). Fetched via Voltaire,
 * cached for EvmActor display.
 */

import {
	resolveEnsForward,
	resolveEnsReverse,
} from '$/api/identity-resolve.ts'
import {
	getCachedEnsAvatar,
	setCachedEnsAvatar,
} from '$/collections/EnsAvatars.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import { identityResolvers } from '$/constants/identity-resolver.ts'
import type { ChainId } from '$/constants/networks.ts'
import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
import type { EvmActorProfile, EvmActorProfile$Id } from '$/data/EvmActorProfile.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type EvmActorProfileRow = EvmActorProfile & {
	isLoading?: boolean
	error?: string | null
}

export const evmActorProfilesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.EvmActorProfiles,
		storageKey: CollectionId.EvmActorProfiles,
		getKey: (row: EvmActorProfileRow) =>
			`${row.$id.$network.chainId}:${row.$id.address.toLowerCase()}`,
		parser: { stringify, parse },
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
	if (evmActorProfilesCollection.state.get(key)) return
	const cached = getCachedEnsAvatar(chainId, normalized)
	if (cached) {
		evmActorProfilesCollection.insert({
			$id: { $network: { chainId }, address: normalized },
			primaryName: cached.primaryName,
			avatarUrl: cached.avatarUrl,
			$source: DataSourceId.Voltaire,
		})
		return
	}
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
	const $id: EvmActorProfile$Id = { $network: { chainId }, address }

	if (existing) {
		evmActorProfilesCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		evmActorProfilesCollection.insert({
			$id,
			$source: DataSourceId.Voltaire,
			isLoading: true,
			error: null,
		})
	}

	const resolver = getEnsResolverForChain(chainId)
	const url = getEffectiveRpcUrl(chainId)
	if (!resolver?.ensRegistry || !url) {
		const err = resolver
			? `No RPC URL for chain ${chainId}`
			: `No ENS resolver for chain ${chainId}`
		evmActorProfilesCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = err
		})
		return { $id, $source: DataSourceId.Voltaire }
	}

	try {
		const provider = createProviderForChain(chainId)
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
			$source: DataSourceId.Voltaire,
			isLoading: false,
			error: null,
		}
		evmActorProfilesCollection.update(key, (draft) => {
			Object.assign(draft, row)
		})
		setCachedEnsAvatar({
			$id: { $network: { chainId }, address },
			avatarUrl: row.avatarUrl,
			primaryName: row.primaryName,
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
