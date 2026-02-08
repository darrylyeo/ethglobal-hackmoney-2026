/**
 * Watched entities: pin any entity to the nav. Persisted to localStorage.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { EntityType } from '$/data/$EntityType.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type WatchedEntityRow = {
	entityType: EntityType
	id: string
	label: string
	href: string
	addedAt: number
	$source: DataSource
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
		$source: DataSource.Local,
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
