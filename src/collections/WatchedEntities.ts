/**
 * Watched entities: pin any entity to the nav. Persisted as entityType + entityId (typed); label/href are derived in navigationItems.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DEFAULT_WATCHED_ENTITIES } from '$/constants/default-watched-entities.ts'
import { EntityType, type EntityId } from '$/data/$EntityType.ts'
import { entityKey } from '$/lib/entity-key.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

const encodeStorageKey = (key: string) => `s:${key}`

export type WatchedEntityStored = {
	entityType: EntityType
	entityId: EntityId
	addedAt: number
}

export type WatchedEntity = WatchedEntityStored & {
	id: string
	label: string
	href: string
}

export const watchedEntitiesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.WatchedEntities,
		storageKey: CollectionId.WatchedEntities,
		getKey: (item: WatchedEntityStored) =>
			entityKey({
				entityType: item.entityType,
				entityId: item.entityId,
			}),
		parser: { stringify, parse },
	}),
)

export const watchEntity = (entity: {
	entityType: EntityType
	entityId: EntityId
}) => {
	const key = entityKey(entity)
	const existing = watchedEntitiesCollection.state.get(key) as
		| WatchedEntityStored
		| undefined
	const now = Date.now()
	if (existing) {
		watchedEntitiesCollection.update(key, (draft) => {
			;(draft as WatchedEntityStored).addedAt = now
		})
		return
	}
	watchedEntitiesCollection.insert({
		...entity,
		addedAt: now,
	})
}

export const unwatchEntity = (entityType: EntityType, entityId: EntityId) => {
	watchedEntitiesCollection.delete(entityKey({ entityType, entityId }))
}

export const isEntityWatched = (entityType: EntityType, entityId: EntityId) =>
	watchedEntitiesCollection.state.has(
		entityKey({ entityType, entityId }),
	)

export const seedDefaultWatchedEntities = () => {
	for (const entity of DEFAULT_WATCHED_ENTITIES) watchEntity(entity)
}

export const defaultWatchedEntitiesBlob = (): string => {
	const now = Date.now()
	const obj: Record<
		string,
		{ versionKey: string; data: WatchedEntityStored }
	> = {}
	for (const entity of DEFAULT_WATCHED_ENTITIES) {
		const key = encodeStorageKey(entityKey(entity))
		obj[key] = {
			versionKey: crypto.randomUUID(),
			data: { ...entity, addedAt: now },
		}
	}
	return stringify(obj)
}
