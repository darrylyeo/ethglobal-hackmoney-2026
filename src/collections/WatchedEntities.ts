/**
 * Watched entities: pin any entity to the nav. Persisted as entityType + entityId (typed); label/href are derived.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DEFAULT_WATCHED_ENTITIES } from '$/constants/default-watched-entities.ts'
import { ercTokens } from '$/constants/coins.ts'
import {
	networkConfigsByChainId,
	networkConfigsBySlug,
} from '$/constants/networks.ts'
import { EntityType, type EntityId } from '$/data/$EntityType.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { formatAddress } from '$/lib/address.ts'

const encodeStorageKey = (key: string) => `s:${key}`

export type WatchedEntityStoredRow = {
	entityType: EntityType
	entityId: EntityId
	addedAt: number
}

export type WatchedEntityRow = WatchedEntityStoredRow & {
	id: string
	label: string
	href: string
}

export const watchedEntityKey = (row: {
	entityType: EntityType
	entityId: string | EntityId
}) =>
	`${row.entityType}:${
		typeof row.entityId === 'string' ? row.entityId : stringify(row.entityId)
	}`

type LegacyStoredRow = {
	entityType: EntityType
	id: string
	label?: string
	href?: string
	addedAt: number
}

const getEntityIdRaw = (
	stored: WatchedEntityStoredRow | LegacyStoredRow,
): string | EntityId => ('entityId' in stored ? stored.entityId : stored.id)

export const deriveWatchedEntityRow = (
	stored: WatchedEntityStoredRow | LegacyStoredRow,
): WatchedEntityRow => {
	const entityType = stored.entityType
	const entityIdRaw = getEntityIdRaw(stored)
	const id = watchedEntityKey({
		entityType,
		entityId: entityIdRaw,
	})
	const addedAt = stored.addedAt
	if (typeof entityIdRaw === 'string') {
		if (entityType === EntityType.Coin) {
			const token = ercTokens.find(
				(t) =>
					t.symbol === entityIdRaw ||
					t.address.toLowerCase() === entityIdRaw.toLowerCase(),
			)
			const coinId: EntityId<EntityType.Coin> = token
				? {
						$network: { chainId: token.chainId },
						address: token.address,
						interopAddress: token.symbol,
					}
				: {
						$network: { chainId: 1 },
						address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
						interopAddress: entityIdRaw,
					}
			return {
				entityType,
				entityId: coinId,
				addedAt,
				id,
				label: entityIdRaw,
				href: `/coin/${entityIdRaw}`,
			}
		}
		if (entityType === EntityType.Network) {
			const config =
				networkConfigsBySlug[entityIdRaw.toLowerCase()] ??
				(Number.isFinite(Number(entityIdRaw))
					? networkConfigsByChainId[Number(entityIdRaw)]
					: null)
			const netId: EntityId<EntityType.Network> = {
				chainId: (config?.chainId ?? 0) as EntityId<EntityType.Network>['chainId'],
			}
			return {
				entityType,
				entityId: netId,
				addedAt,
				id,
				label: config?.name ?? entityIdRaw,
				href: `/network/${entityIdRaw}`,
			}
		}
		if (entityType === EntityType.Contract) {
			const [slug, address] = entityIdRaw.split(':')
			const config = slug != null ? networkConfigsBySlug[slug.toLowerCase()] ?? null : null
			const href =
				slug != null && address != null
					? `/network/${slug}/contract/${address}`
					: `/network/${entityIdRaw}`
			const contractId: EntityId<EntityType.Contract> = {
				$network: { chainId: (config?.chainId ?? 0) as EntityId<EntityType.Contract>['$network']['chainId'] },
				address: (address ?? '0x0') as `0x${string}`,
			}
			return {
				entityType,
				entityId: contractId,
				addedAt,
				id,
				label: address != null ? formatAddress(address as `0x${string}`) : entityIdRaw,
				href,
			}
		}
		const fallbackId = { chainId: 0 } as EntityId
		return {
			entityType,
			entityId: fallbackId,
			addedAt,
			id,
			label: entityIdRaw,
			href: `#${entityIdRaw}`,
		}
	}
	if (entityType === EntityType.Coin) {
		const coinId = entityIdRaw as EntityId<EntityType.Coin>
		const token = ercTokens.find(
			(t) =>
				t.chainId === coinId.$network.chainId &&
				t.address.toLowerCase() === coinId.address.toLowerCase(),
		)
		const symbol = coinId.interopAddress ?? token?.symbol ?? formatAddress(coinId.address)
		const slug = networkConfigsByChainId[coinId.$network.chainId]?.slug ?? null
		return {
			entityType,
			entityId: coinId,
			addedAt,
			id,
			label: symbol,
			href: `/coin/${symbol}`,
		}
	}
	if (entityType === EntityType.Network) {
		const netId = entityIdRaw as EntityId<EntityType.Network>
		const config = networkConfigsByChainId[netId.chainId]
		const slug = networkConfigsByChainId[netId.chainId]?.slug ?? String(netId.chainId)
		return {
			entityType,
			entityId: netId,
			addedAt,
			id,
			label: config?.name ?? String(netId.chainId),
			href: `/network/${slug}`,
		}
	}
	if (entityType === EntityType.Contract) {
		const contractId = entityIdRaw as EntityId<EntityType.Contract>
		const slug = networkConfigsByChainId[contractId.$network.chainId]?.slug ?? null
		const path =
			slug != null
				? `/network/${slug}/contract/${contractId.address}`
				: `/network/${contractId.$network.chainId}/contract/${contractId.address}`
		return {
			entityType,
			entityId: contractId,
			addedAt,
			id,
			label: formatAddress(contractId.address),
			href: path,
		}
	}
	return {
		entityType,
		entityId: entityIdRaw,
		addedAt,
		id,
		label: stringify(entityIdRaw),
		href: `#${id}`,
	}
}

export const watchedEntitiesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.WatchedEntities,
		storageKey: CollectionId.WatchedEntities,
		getKey: (row: WatchedEntityStoredRow | LegacyStoredRow) =>
			watchedEntityKey({
				entityType: row.entityType,
				entityId: getEntityIdRaw(row),
			}),
		parser: { stringify, parse },
	}),
)

export const watchEntity = (row: {
	entityType: EntityType
	entityId: EntityId
}) => {
	const key = watchedEntityKey(row)
	const existing = watchedEntitiesCollection.state.get(key) as
		| WatchedEntityStoredRow
		| undefined
	const now = Date.now()
	if (existing) {
		watchedEntitiesCollection.update(key, (draft) => {
			;(draft as WatchedEntityStoredRow).addedAt = now
		})
		return
	}
	watchedEntitiesCollection.insert({
		...row,
		addedAt: now,
	})
}

export const unwatchEntity = (entityType: EntityType, entityId: EntityId) => {
	watchedEntitiesCollection.delete(watchedEntityKey({ entityType, entityId }))
}

export const isEntityWatched = (entityType: EntityType, entityId: EntityId) =>
	watchedEntitiesCollection.state.has(
		watchedEntityKey({ entityType, entityId }),
	)

export const listWatchedEntities = (): WatchedEntityRow[] =>
	[...watchedEntitiesCollection.state]
		.map(([, row]) => deriveWatchedEntityRow(row as WatchedEntityStoredRow | LegacyStoredRow))
		.sort((a, b) => b.addedAt - a.addedAt)

export const seedDefaultWatchedEntities = () => {
	for (const row of DEFAULT_WATCHED_ENTITIES) watchEntity(row)
}

export const defaultWatchedEntitiesBlob = (): string => {
	const now = Date.now()
	const obj: Record<
		string,
		{ versionKey: string; data: WatchedEntityStoredRow }
	> = {}
	for (const row of DEFAULT_WATCHED_ENTITIES) {
		const key = encodeStorageKey(watchedEntityKey(row))
		obj[key] = {
			versionKey: crypto.randomUUID(),
			data: { ...row, addedAt: now },
		}
	}
	return stringify(obj)
}
