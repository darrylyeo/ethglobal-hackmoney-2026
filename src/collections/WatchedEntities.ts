/**
 * Watched entities: pin any entity to the nav. Persisted to localStorage.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DEFAULT_WATCHED_ENTITIES } from '$/constants/default-watched-entities.ts'
import { EntityType } from '$/data/$EntityType.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

const encodeStorageKey = (key: string) => `s:${key}`

export type WatchedEntityRow = {
	entityType: EntityType
	id: string
	label: string
	href: string
	addedAt: number
}

const getKey = (row: WatchedEntityRow) => `${row.entityType}:${row.id}`

export const watchedEntitiesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.WatchedEntities,
		storageKey: CollectionId.WatchedEntities,
		getKey,
		parser: { stringify, parse },
	}),
)

export const watchEntity = (row: Omit<WatchedEntityRow, '$source' | 'addedAt'>) => {
	const key = `${row.entityType}:${row.id}`
	const existing = watchedEntitiesCollection.state.get(key) as
		| WatchedEntityRow
		| undefined
	const now = Date.now()
	if (existing) {
		watchedEntitiesCollection.update(key, (draft) => {
			draft.label = row.label
			draft.href = row.href
			draft.addedAt = now
		})
		return
	}
	watchedEntitiesCollection.insert({
		...row,
		addedAt: now,
	})
}

export const unwatchEntity = (entityType: EntityType, id: string) => {
	const key = `${entityType}:${id}`
	watchedEntitiesCollection.delete(key)
}

export const isEntityWatched = (entityType: EntityType, id: string) =>
	watchedEntitiesCollection.state.has(`${entityType}:${id}`)

export const listWatchedEntities = (): WatchedEntityRow[] =>
	[...watchedEntitiesCollection.state]
		.map(([, row]) => row as WatchedEntityRow)
		.sort((a, b) => b.addedAt - a.addedAt)

export const seedDefaultWatchedEntities = () => {
	for (const row of DEFAULT_WATCHED_ENTITIES) watchEntity(row)
}

export const defaultWatchedEntitiesBlob = (): string => {
	const now = Date.now()
	const obj: Record<
		string,
		{ versionKey: string; data: (typeof DEFAULT_WATCHED_ENTITIES)[number] & { addedAt: number } }
	> = {}
	for (const row of DEFAULT_WATCHED_ENTITIES)
		obj[encodeStorageKey(`${row.entityType}:${row.id}`)] = {
			versionKey: crypto.randomUUID(),
			data: { ...row, addedAt: now },
		}
	return stringify(obj)
}
