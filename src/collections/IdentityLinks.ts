/**
 * Identity links collection: normalized identity input and resolved
 * payloads (address, name, text records). Persisted to localStorage;
 * resolution via Voltaire RPC.
 */

import { resolveIdentity } from '$/api/identity-resolve.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { ChainId } from '$/constants/networks.ts'
import { IdentityInputKind, type IdentityResolution } from '$/constants/identity-resolver.ts'
import { normalizeIdentity } from '$/api/identity-resolve.ts'
import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type IdentityLinkRow = IdentityResolution & {
	$source: DataSource
	isLoading?: boolean
}

export const identityLinkKey = (chainId: ChainId, raw: string) => {
	const { kind, normalized } = normalizeIdentity(raw)
	return (
		kind === IdentityInputKind.EnsName
			? `identity:${chainId}:ens:${normalized}`
			: `identity:${chainId}:addr:${normalized}`
	)
}

export const identityLinks = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.IdentityLinks,
		storageKey: CollectionId.IdentityLinks,
		getKey: (row: IdentityLinkRow) => row.id,
		parser: { stringify, parse },
	}),
)

export const ensureIdentityLink = (chainId: ChainId, raw: string): void => {
	const key = identityLinkKey(chainId, raw)
	if (identityLinks.state.get(key)) return
	fetchIdentityLink(chainId, raw).catch(() => {})
}

export const fetchIdentityLink = async (
	chainId: ChainId,
	raw: string,
): Promise<IdentityLinkRow> => {
	const key = identityLinkKey(chainId, raw)
	const { kind, normalized } = normalizeIdentity(raw)
	const url = getEffectiveRpcUrl(chainId)
	const now = Date.now()
	const placeholder: IdentityLinkRow = {
		id: key,
		raw,
		normalized,
		kind,
		chainId,
		createdAt: now,
		updatedAt: now,
		source: DataSource.Voltaire,
		$source: DataSource.Voltaire,
		isLoading: true,
	}
	if (!url) {
		placeholder.isLoading = false
		identityLinks.utils.writeUpsert(placeholder)
		return placeholder
	}
	identityLinks.utils.writeUpsert(placeholder)
	const provider = createProviderForChain(chainId)
	const existing = identityLinks.state.get(key) as
		| IdentityLinkRow
		| undefined
	const partial = await resolveIdentity(
		provider,
		chainId,
		raw,
		existing ?? null,
	)
	const row: IdentityLinkRow = {
		id: key,
		raw,
		normalized,
		kind: partial.kind ?? kind,
		chainId: partial.chainId ?? chainId,
		resolverId: partial.resolverId,
		createdAt: existing?.createdAt ?? now,
		updatedAt: now,
		resolvedAt: partial.resolvedAt,
		address: partial.address,
		interopAddress: partial.interopAddress,
		name: partial.name,
		textRecords: partial.textRecords,
		avatarUrl: partial.avatarUrl,
		source: DataSource.Voltaire,
		$source: DataSource.Voltaire,
		isLoading: false,
	}
	identityLinks.utils.writeUpsert(row)
	return row
}
