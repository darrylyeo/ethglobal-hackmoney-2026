/**
 * Watched entities: pin any entity to the nav. Persisted as entityType + entityId (typed); label/href are derived in navigationItems.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DEFAULT_WATCHED_ENTITIES } from '$/constants/default-watched-entities.ts'
import { EntityType, type EntityId } from '$/data/$EntityType.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

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

export const watchedEntitiesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.WatchedEntities,
		storageKey: CollectionId.WatchedEntities,
		getKey: (row: WatchedEntityStoredRow) =>
			watchedEntityKey({
				entityType: row.entityType,
				entityId: row.entityId,
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
